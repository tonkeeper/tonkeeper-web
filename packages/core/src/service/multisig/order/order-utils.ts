import {
    Address,
    beginCell,
    Dictionary,
    MessageRelaxed,
    SendMode,
    storeMessageRelaxed
} from '@ton/core';
import { arrayToCell, MultisigOp, MultisigParams } from '../utils';

export type TransferRequest = { type: 'transfer'; sendMode: SendMode; message: MessageRelaxed };
export type UpdateRequest = {
    type: 'update';
    threshold: number;
    signers: Address[];
    proposers: Address[];
};

export type Action = TransferRequest | UpdateRequest;
export type NewOrder = {
    actions: Action[];
    validUntilSeconds: number;
};

export const MAX_ORDER_SEQNO =
    115792089237316195423570985008687907853269984665640564039457584007913129639935n;

export function createNewOrderMessage(
    actions: Action[],
    expirationDate: number,
    isSigner: boolean,
    addrIdx: number,
    order_id = MAX_ORDER_SEQNO,
    query_id: number | bigint = 0
) {
    if (actions.length === 0) {
        throw new Error("Order list can't be empty!");
    }

    const msgBody = beginCell()
        .storeUint(MultisigOp.multisig.new_order, MultisigParams.bitsize.op)
        .storeUint(query_id, MultisigParams.bitsize.queryId)
        .storeUint(order_id, MultisigParams.bitsize.orderSeqno)
        .storeBit(isSigner)
        .storeUint(addrIdx, MultisigParams.bitsize.signerIndex)
        .storeUint(expirationDate, MultisigParams.bitsize.time);

    const order_cell = packOrderBody(actions);
    return msgBody.storeRef(order_cell).endCell();
}

export function packOrderBody(actions: Array<Action>) {
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
