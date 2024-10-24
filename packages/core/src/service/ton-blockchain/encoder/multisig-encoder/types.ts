import { Address, MessageRelaxed, SendMode } from '@ton/core';

export type MultisigOrderStatus = 'progress' | 'completed' | 'expired';

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

export type MultisigConfig = {
    threshold: number;
    signers: Address[];
    proposers: Address[];
    allowArbitrarySeqno: boolean;
};
