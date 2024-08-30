import { APIConfig } from '../../../entries/apis';
import { BlockchainApi, EmulationApi, Multisig, MultisigOrder } from '../../../tonApiV2';
import { NewOrder, packOrderBody } from './order-utils';
import { Address, beginCell, Cell, contractAddress, toNano, storeMessage } from '@ton/core';
import { arrayToCell, MultisigOp, MultisigParams } from '../utils';
import { bufferToBigInt } from '../../../utils/common';

export async function estimateExistingOrder({
    api,
    order,
    multisig
}: {
    api: APIConfig;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    order: Pick<MultisigOrder, 'orderSeqno' | 'address' | 'expirationDate'>;
}) {
    const result = await new BlockchainApi(api.tonApiV2).execGetMethodForBlockchainAccount({
        accountId: order.address,
        methodName: 'get_order_data'
    });

    const orderSeqno = result.stack[1]?.num;
    const orderValidUntilSeconds = result.stack[result.stack.length - 2]?.num;
    const orderBodyData = result.stack[result.stack.length - 1]?.cell;

    if (!orderBodyData || !orderValidUntilSeconds || orderSeqno === undefined) {
        throw new Error('Order data not found');
    }

    const orderBodyCell = Cell.fromBase64(orderBodyData);

    return estimateOrderByBodyCell({
        api,
        orderBodyCell,
        multisig,
        orderValidUntilSeconds: Number(orderValidUntilSeconds),
        orderSeqno: Number(orderSeqno)
    });
}

export async function estimateNewOrder(options: {
    api: APIConfig;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    order: NewOrder;
}) {
    const orderBodyCell = packOrderBody(options.order.actions);

    return estimateOrderByBodyCell({
        ...options,
        orderBodyCell,
        orderValidUntilSeconds: options.order.validUntilSeconds
    });
}

async function estimateOrderByBodyCell(options: {
    api: APIConfig;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    orderBodyCell: Cell;
    orderValidUntilSeconds: number;
    orderSeqno?: number;
}) {
    let orderSeqno = options.orderSeqno;
    if (orderSeqno === undefined) {
        const result = await new BlockchainApi(
            options.api.tonApiV2
        ).execGetMethodForBlockchainAccount({
            accountId: options.multisig.address,
            methodName: 'get_multisig_data'
        });

        const nextSeqno = result.stack[0]?.num;
        if (nextSeqno === undefined) {
            throw new Error("Can't get next seqno");
        }

        orderSeqno = Number(nextSeqno);
    }

    const orderData = orderConfigToCell({
        multisigAddress: options.multisig.address,
        orderSeqno
    });
    const orderStateInit = {
        data: orderData,
        /**
         * https://raw.githubusercontent.com/ton-blockchain/multisig-contract-v2/2cb4b84faf5a6340c2d452695f35779c997ae0f0/build/Order.compiled.json
         */
        code: Cell.fromBase64(
            Buffer.from(
                'b5ee9c7241020c01000376000114ff00f4a413f4bcf2c80b01020162030200c7a1c771da89a1f48003f0c3a7fe03f0c441ae9380011c2c60dbf0c6dbf0c8dbf0cadbf0ccdbf0cedbf0d0dbf0d31c45a60e03f0c7a40003f0c9a803f0cba7fe03f0cda60e03f0cfa65e03f0d1a803f0d3a3c5f083f085f087f089f08bf08df08ff091f09303f8d03331d0d3030171b0915be0fa403001d31f01ed44d0fa4001f861d3ff01f86220d749c0008e16306df8636df8646df8656df8666df8676df8686df8698e22d30701f863d20001f864d401f865d3ff01f866d30701f867d32f01f868d401f869d1e220c000e30201d33f012282109c73fba2bae302028210a762230f070504014aba8e9bd3070101d1f845521078f40e6fa1f2e06a5230c705f2e06a59db3ce05f03840ff2f00802fe32f84113c705f2e068f8436e8ef101d30701f86370f864d401f86570f86670f867d32f01f868f848f823bef2e06fd401f869d200018e99d30701aef84621b0f2d06bf847a4f867f84601b1f86601db3c9131e2d1f849f846f845c8f841cf16f84201cbfff84301cb07f84401ca00cccbfff84701cb07f84801cb2fccc9ed540a06018ce001d30701f843baf2e069d401f900f845f900baf2e069d32f01f848baf2e069d401f900f849f900baf2e069d20001f2e069d3070101d1f845521078f40e6fa1f2e06a58db3c0801c83020d74ac0008e23c8708e1a22d7495230d71912cf1622d74a9402d74cd093317f58e2541220e63031c9d0df840f018b7617070726f76658c705f2f420707f8e19f84578f47c6fa5209b5243c70595317f327001de9132e201b3e632f2e06af82512db3c08026e8f335ced44ed45ed478e983170c88210afaf283e580402cb1fcb3fcb1f80108050db3ced67ed65ed64727fed118aed41edf101f2ffdb030b0902b4f844f2d07002aef84621b0f2d06bf847a4f867f84601b1f86670c8821082609bf62402cb1fcb3f80108050db3cdb3cf849f846f845c8f841cf16f84201cbfff84301cb07f84401ca00cccbfff84701cb07f84801cb2fccc9ed540b0a0180f847f843ba8eb6f84170f849c8821075097f5d580502cb1fcb3ff84201cbfff84801cb2ff84701cb07f845f90001cbff13cc128010810090db3c7ff8649130e20b00888e40c85801cb055004cf1658fa02547120ed44ed45ed479d5bc85003cf17c9127158cb6acced67ed65ed64737fed11977001cb6a01cf17ed41edf101f2ffc901fb00db0545f8021c',
                'hex'
            ).toString('base64')
        )
    };

    const orderAddress = contractAddress(
        Address.parse(options.multisig.address).workChain,
        orderStateInit
    );

    const signers = beginCell()
        .storeDictDirect(arrayToCell(options.multisig.signers.map(s => Address.parse(s))))
        .endCell();

    // const orderCell = packOrderBody(options.order.actions);

    const msgBody = beginCell()
        .storeUint(MultisigOp.multisig.execute, MultisigParams.bitsize.op)
        .storeUint(0, MultisigParams.bitsize.queryId)
        .storeUint(orderSeqno, MultisigParams.bitsize.orderSeqno)
        .storeUint(options.orderValidUntilSeconds, MultisigParams.bitsize.time)
        .storeUint(options.multisig.threshold, MultisigParams.bitsize.signerIndex)
        .storeUint(bufferToBigInt(signers.hash()), 256)
        .storeRef(options.orderBodyCell)
        .endCell();

    const msgCell = beginCell()
        .store(
            storeMessage({
                info: {
                    type: 'internal',
                    ihrDisabled: true,
                    bounce: false,
                    bounced: false,
                    src: orderAddress,
                    dest: Address.parse(options.multisig.address),
                    value: { coins: toNano(0.2) },
                    ihrFee: 0n,
                    forwardFee: 0n,
                    createdLt: 0n,
                    createdAt: 0
                },
                body: msgBody
            })
        )
        .endCell();

    return new EmulationApi(options.api.tonApiV2).emulateMessageToWallet({
        emulateMessageToWalletRequest: { boc: msgCell.toString('base64') }
    });

    /**
     * () try_execute(int query_id) impure inline_ref {
     *     if (approvals_num == threshold) {
     *         send_message_with_only_body(
     *             multisig_address,
     *             0,
     *             begin_cell()
     *             .store_op_and_query_id(op::execute, query_id)
     *             .store_order_seqno(order_seqno)
     *             .store_timestamp(expiration_date)
     *             .store_index(approvals_num)
     *             .store_hash(signers.cell_hash())
     *             .store_ref(order),
     *             NON_BOUNCEABLE,
     *             SEND_MODE_CARRY_ALL_BALANCE | SEND_MODE_BOUNCE_ON_ACTION_FAIL
     *         );
     *         sent_for_execution? = true;
     *     }
     * }
     */
}

export function orderConfigToCell(config: { multisigAddress: string; orderSeqno: number }): Cell {
    return beginCell()
        .storeAddress(Address.parse(config.multisigAddress))
        .storeUint(config.orderSeqno, MultisigParams.bitsize.orderSeqno)
        .endCell();
}
