import { Cell } from '@ton/core';
import { LedgerTransaction } from '../service/ledger/connector';
import { KeystoneMessageType } from '../service/keystone/types';

export type BaseSigner = (message: Cell) => Promise<Buffer>;

export type CellSigner = (BaseSigner) & { type: 'cell' };

export type LedgerSigner = ((path: number[], message: LedgerTransaction) => Promise<Cell>) & {
    type: 'ledger';
};

export type KeystoneSigner = ((message: Cell, messageType: KeystoneMessageType, pathInfo?: {path: string, mfp: string}) => Promise<Buffer>) & {
    type: 'keystone';
};

export type Signer = CellSigner | LedgerSigner | KeystoneSigner;
