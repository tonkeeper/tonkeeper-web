import { Cell } from '@ton/core';
import { KeyPair } from '@ton/crypto';
import type { SignedTransaction, Transaction } from 'tronweb/src/types/Transaction';

import { IAppSdk } from '../../AppSdk';
import { AccountId } from '../../entries/account';
import { WalletId } from '../../entries/wallet';
import { ChainId } from '../../chains';
import { LedgerTransaction } from '../ledger/connector';

/**
 * Cell-based signer used by every TON wallet contract version. The `type`
 * brand lets the dispatching code in `MessageSender` discriminate the
 * union without instanceof checks.
 */
export type BaseSigner = (message: Cell) => Promise<Buffer>;
export type CellSigner = BaseSigner & { type: 'cell' };

/**
 * Ledger speaks in batched `LedgerTransaction` payloads and returns Cells
 * already signed by the device. The branded `type` mirrors `CellSigner`.
 */
export type LedgerSigner = ((messages: LedgerTransaction[]) => Promise<Cell[]>) & {
    type: 'ledger';
};

/**
 * Multichain signer union. Today only the two TON variants are
 * populated; non-TON variants (`'eth-typed'`, `'btc-psbt'`, etc.) extend
 * this union when their strategies land. Existing consumers continue to
 * import `Signer` from `entries/signer`, which re-exports this type.
 */
export type ChainSigner = CellSigner | LedgerSigner;
export type Signer = ChainSigner;

export type TronSigner = (tx: Transaction) => Promise<Transaction & SignedTransaction>;

export type MultiTransactionsSigner = (
    txs: (Transaction | Cell)[]
) => Promise<((Transaction & SignedTransaction) | Buffer)[]>;

/**
 * Inputs every `SignerFactory` receives. `chain` is `'ton'` today; once
 * non-TON strategies are registered the registry will dispatch on the
 * full set (`'evm' | 'btc' | 'tron' | 'sol'`).
 */
export interface SignerFactoryArgs {
    sdk: IAppSdk;
    accountId: AccountId;
    chain: ChainId;
    walletId?: WalletId;
    options?: SignerOptions;
}

export interface SignerOptions {
    /**
     * Receives the subscription meta key, derived from the mnemonic the strategy unlocks anyway,
     * so the caller doesn't prompt for the password twice. Strategies without a mnemonic never
     * call it.
     */
    onMetaKeyPair?: (keyPair: KeyPair) => void;
}

export type SignerFactory = (args: SignerFactoryArgs) => Promise<ChainSigner>;
