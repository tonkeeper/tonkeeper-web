import { Cell } from '@ton/core';
import { LedgerTransaction } from '../service/ledger/connector';
import type { SignedTransaction, Transaction } from 'tronweb/src/types/Transaction';

export type BaseSigner = (message: Cell) => Promise<Buffer>;

export type CellSigner = BaseSigner & { type: 'cell' };

export type LedgerSigner = ((messages: LedgerTransaction[]) => Promise<Cell[]>) & {
    type: 'ledger';
};

export type Signer = CellSigner | LedgerSigner;

export type TronSigner = (tx: Transaction) => Promise<Transaction & SignedTransaction>;

/**
 * Access secret once and sign several transactions. Signers must be available only inside callback and closed after use.
 * Applicable only for MAM and Mnemonic accounts
 */
export type OpenedSignerProvider = (
    callback: (signers: { cellSigner: CellSigner; tronSigner: TronSigner }) => Promise<void>
) => Promise<void>;
