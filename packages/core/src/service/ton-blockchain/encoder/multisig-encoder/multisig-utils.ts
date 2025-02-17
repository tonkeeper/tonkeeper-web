import { APIConfig } from '../../../../entries/apis';
import {
    AccountEvent,
    BlockchainApi,
    EmulationApi,
    Multisig,
    MultisigOrder
} from '../../../../tonApiV2';
import {
    Address,
    beginCell,
    Cell,
    toNano,
    storeMessage,
    Dictionary,
    storeMessageRelaxed
} from '@ton/core';
import { bufferToBigInt } from '../../../../utils/common';
import {
    Action,
    MultisigConfig,
    MultisigOrderStatus,
    TransferRequest,
    UpdateRequest
} from './types';
import { WalletOutgoingMessage } from '../types';

export type OrderEstimation =
    | { type: 'transfer'; event: AccountEvent }
    | { type: 'update'; config: Omit<MultisigConfig, 'allowArbitrarySeqno'> };

export const MultisigOp = {
    multisig: {
        new_order: 0xf718510f,
        execute: 0x75097f5d,
        execute_internal: 0xa32c59bf
    },

    order: {
        approve: 0xa762230f,
        expired: 0x6,
        approve_rejected: 0xafaf283e,
        approved: 0x82609bf6,
        init: 0x9c73fba2
    },

    actions: {
        send_message: 0xf1381e5b,
        update_multisig_params: 0x1d0cfbd3
    }
};

export const MultisigParams = {
    bitsize: {
        op: 32,
        queryId: 64,
        orderSeqno: 256,
        signerIndex: 8,
        actionIndex: 8,
        time: 48
    }
};

export function arrayToCell(arr: Array<Address>): Dictionary<number, Address> {
    const dict = Dictionary.empty(Dictionary.Keys.Uint(8), Dictionary.Values.Address());
    for (let i = 0; i < arr.length; i++) {
        dict.set(i, arr[i]);
    }
    return dict;
}

export const MAX_ORDER_SEQNO =
    115792089237316195423570985008687907853269984665640564039457584007913129639935n;

export const getOrderSeqno = async (api: APIConfig, multisigAddress: string) => {
    const result = await new BlockchainApi(api.tonApiV2).execGetMethodForBlockchainAccount({
        accountId: multisigAddress,
        methodName: 'get_multisig_data'
    });

    const nextSeqno = result.stack[0]?.num;
    if (nextSeqno === undefined) {
        throw new Error("Can't get next seqno");
    }

    const nextSeqnoParsed = parseInt(nextSeqno);

    if (nextSeqnoParsed < -1) {
        throw new Error('Invalid next seqno');
    }

    /**
     * if ~ allow_arbitrary_order_seqno
     */
    if (nextSeqnoParsed !== -1) {
        return MAX_ORDER_SEQNO;
    } else {
        return BigInt(Date.now());
    }
};

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

export function orderStatus(order: MultisigOrder): MultisigOrderStatus {
    if (order.sentForExecution) {
        return 'completed';
    }

    if (order.expirationDate * 1000 > Date.now()) {
        return 'progress';
    }

    return 'expired';
}

export async function estimateOrderByOutgoingMessage(params: {
    api: APIConfig;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    outgoing: WalletOutgoingMessage;
    orderValidUntilSeconds: number;
}) {
    const orderBodyCell = packMultisigOrderBody(
        params.outgoing.messages.map(message => ({
            type: 'transfer',
            message,
            sendMode: params.outgoing.sendMode
        }))
    );

    let emulation = await estimateOrderByBodyCell({
        api: params.api,
        orderBodyCell,
        multisig: params.multisig,
        orderValidUntilSeconds: params.orderValidUntilSeconds
    });

    emulation = hideMultisigCallFromEstimation(params.multisig.address, emulation);

    return emulation;
}

export async function estimateOrderByBodyCell(options: {
    api: APIConfig;
    multisig: Pick<Multisig, 'address' | 'signers' | 'threshold'>;
    orderBodyCell: Cell;
    orderValidUntilSeconds: number;
    orderSeqno?: number | bigint;
}) {
    let orderSeqno: number | bigint | undefined = options.orderSeqno;
    if (orderSeqno === undefined) {
        orderSeqno = await getOrderSeqno(options.api, options.multisig.address);
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

function hideMultisigCallFromEstimation(
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

export function packMultisigOrderBody(actions: Array<Action>) {
    const order_dict = Dictionary.empty(Dictionary.Keys.Uint(8), Dictionary.Values.Cell());
    if (actions.length > 255) {
        throw new Error('For action chains above 255, use packLarge method');
    } else {
        // pack transfers to the order_body cell
        for (let i = 0; i < actions.length; i++) {
            const action = actions[i];
            const actionCell =
                action.type === 'transfer'
                    ? packTransferRequest(action)
                    : packUpdateRequest(action);
            order_dict.set(i, actionCell);
        }
        return beginCell().storeDictDirect(order_dict).endCell();
    }
}

function packTransferRequest(transfer: TransferRequest) {
    const message = beginCell().store(storeMessageRelaxed(transfer.message)).endCell();
    return beginCell()
        .storeUint(MultisigOp.actions.send_message, MultisigParams.bitsize.op)
        .storeUint(transfer.sendMode, 8)
        .storeRef(message)
        .endCell();
}

function packUpdateRequest(update: UpdateRequest) {
    return beginCell()
        .storeUint(MultisigOp.actions.update_multisig_params, MultisigParams.bitsize.op)
        .storeUint(update.threshold, MultisigParams.bitsize.signerIndex)
        .storeRef(beginCell().storeDictDirect(arrayToCell(update.signers)))
        .storeDict(arrayToCell(update.proposers))
        .endCell();
}
