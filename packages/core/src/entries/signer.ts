import { Cell } from '@ton/core';
import { LedgerTransaction } from '../service/ledger/connector';

export type BaseSigner = (message: Cell) => Promise<Buffer>;

export type CellSigner = BaseSigner & { type: 'cell' };

export type LedgerSigner = ((messages: LedgerTransaction[]) => Promise<Cell[]>) & {
    type: 'ledger';
};

export type Signer = CellSigner | LedgerSigner;
