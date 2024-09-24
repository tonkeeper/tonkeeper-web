import { Address, Dictionary } from '@ton/core';

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
