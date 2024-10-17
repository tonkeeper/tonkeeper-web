import { APIConfig } from '../../../entries/apis';
import {
    AccountEvent,
    BlockchainApi,
    EmulationApi,
    Multisig,
    MultisigOrder
} from '../../../tonApiV2';
import { NewOrder, packOrderBody } from './order-utils';
import { Address, beginCell, Cell, toNano, storeMessage, Dictionary } from '@ton/core';
import { arrayToCell, MultisigOp, MultisigParams } from '../utils';
import { bufferToBigInt } from '../../../utils/common';
import { MultisigConfig } from '../deploy';
import { getOrderSeqno } from './order-send';

export type OrderEstimation =
    | { type: 'transfer'; event: AccountEvent }
    | { type: 'update'; config: Omit<MultisigConfig, 'allowArbitrarySeqno'> };

export async function estimateExistingOrder({
    api,
    order,
    multisig
}: {
    api: APIConfig;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    order: Pick<MultisigOrder, 'orderSeqno' | 'address' | 'expirationDate'>;
}): Promise<OrderEstimation> {
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

    const orderBodyCell = Cell.fromBoc(Buffer.from(orderBodyData, 'hex'))[0];

    const dict = orderBodyCell
        .beginParse()
        .loadDictDirect(Dictionary.Keys.Uint(8), Dictionary.Values.Cell());

    /**
     *     return beginCell()
     *         .storeUint(MultisigOp.actions.update_multisig_params, MultisigParams.bitsize.op)
     *         .storeUint(update.threshold, MultisigParams.bitsize.signerIndex)
     *         .storeRef(beginCell().storeDictDirect(arrayToCell(update.signers)))
     *         .storeDict(arrayToCell(update.proposers))
     *         .endCell();
     */
    const dictKeys = dict.keys();
    for (const key of dictKeys) {
        const val = dict.get(key);
        const action = val!.beginParse();
        const op = action.loadUint(MultisigParams.bitsize.op);
        if (op === MultisigOp.actions.update_multisig_params) {
            if (dictKeys.length > 1) {
                throw new Error('Only one update action emulation is supported');
            }

            const threshold = action.loadUint(MultisigParams.bitsize.signerIndex);
            const signers = action
                .loadRef()
                .beginParse()
                .loadDictDirect(Dictionary.Keys.Uint(8), Dictionary.Values.Address())
                .values();
            const proposers = action
                .loadDict(Dictionary.Keys.Uint(8), Dictionary.Values.Address())
                .values();

            if (proposers.length !== 0) {
                throw new Error('Proposers emulation is not supported');
            }

            return {
                type: 'update',
                config: {
                    threshold,
                    signers,
                    proposers
                }
            };
        }
    }

    let emulation = await estimateOrderByBodyCell({
        api,
        orderBodyCell,
        multisig,
        orderValidUntilSeconds: Number(orderValidUntilSeconds),
        orderSeqno: Number(orderSeqno)
    });

    emulation = hideMultisigCallFromEstimation(multisig.address, emulation);

    return {
        type: 'transfer',
        ...emulation
    };
}

export async function estimateNewOrder(options: {
    api: APIConfig;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    order: NewOrder;
}) {
    const orderBodyCell = packOrderBody(options.order.actions);

    const estimation = await estimateOrderByBodyCell({
        ...options,
        orderBodyCell,
        orderValidUntilSeconds: options.order.validUntilSeconds
    });

    return hideMultisigCallFromEstimation(options.multisig.address, estimation);
}

async function estimateOrderByBodyCell(options: {
    api: APIConfig;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    orderBodyCell: Cell;
    orderValidUntilSeconds: number;
    orderSeqno?: number;
}) {
    let orderSeqno: number | bigint | undefined = options.orderSeqno;
    if (orderSeqno === undefined) {
        orderSeqno = await getOrderSeqno({ api: options.api, multisig: options.multisig });
    }

    const execRes = await new BlockchainApi(options.api.tonApiV2).execGetMethodForBlockchainAccount(
        {
            accountId: options.multisig.address,
            methodName: 'get_order_address',
            args: ['0x' + orderSeqno.toString(16)]
        }
    );

    const cell = Cell.fromBoc(Buffer.from(execRes.stack[0].cell!, 'hex'))[0];
    const orderAddress = cell.beginParse().loadAddress();

    const signers = beginCell()
        .storeDictDirect(arrayToCell(options.multisig.signers.map(s => Address.parse(s))))
        .endCell();

    /**
     * https://github.com/ton-blockchain/multisig-contract-v2/blob/2cb4b84faf5a6340c2d452695f35779c997ae0f0/contracts/order.func#L109
     *
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
        .endCell()
        .toBoc();

    const event = await new EmulationApi(options.api.tonApiV2).emulateMessageToAccountEvent({
        accountId: options.multisig.address,
        gaslessEstimateRequestMessagesInner: { boc: msgCell.toString('base64') }
    });

    return { event };
}

export function hideMultisigCallFromEstimation(
    multisigAddress: string,
    estimation: { event: AccountEvent }
) {
    const actions = estimation.event.actions.filter(action => {
        if (
            action.type === 'SmartContractExec' &&
            'smartContractExec' in action &&
            action.smartContractExec
        ) {
            const eventInfo = action.smartContractExec as {
                contract: {
                    address: string;
                };
                operation: 'MultisigExecute';
            };
            if (
                eventInfo.operation === 'MultisigExecute' &&
                eventInfo.contract.address === multisigAddress
            ) {
                return false;
            }
        }

        return true;
    });

    return { ...estimation, event: { ...estimation.event, actions } };
}
