import { Cell } from '@ton/core';
import { LedgerTransaction } from '../service/ledger/connector';
import type { SignedTransaction, Transaction } from 'tronweb/src/types/Transaction';

export type BaseSigner = (message: Cell) => Promise<Buffer>;

export type CellSigner = BaseSigner & { type: 'cell' };

export type LedgerSigner = ((message: LedgerTransaction) => Promise<Cell>) & {
    type: 'ledger';
};

export type Signer = CellSigner | LedgerSigner;

export type TronSigner = (tx: Transaction) => Promise<Transaction & SignedTransaction>;
