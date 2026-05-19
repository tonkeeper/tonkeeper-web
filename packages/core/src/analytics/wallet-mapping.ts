import { Account } from '../entries/account';
import { WalletVersion } from '../entries/wallet';
import { AnalyticsEvent } from './events';

type TransactionSentEvent = Extract<AnalyticsEvent, { eventName: 'transaction_sent' }>;
export type TransactionSentEventType = TransactionSentEvent['event_type'];
export type TransactionSentWalletSource = TransactionSentEvent['wallet_source'];
export type TransactionSentWalletInterface = NonNullable<TransactionSentEvent['wallet_interface']>;
export type TransactionSentWalletChain = TransactionSentEvent['wallet_chain'];

export const toWalletInterface = (
    version: WalletVersion
): TransactionSentWalletInterface | null => {
    switch (version) {
        case WalletVersion.V3R1:
            return 'v3R1';
        case WalletVersion.V3R2:
            return 'v3R2';
        case WalletVersion.V4R1:
            return 'v4R1';
        case WalletVersion.V4R2:
            return 'v4R2';
        case WalletVersion.V5_BETA:
            return 'v5Beta';
        case WalletVersion.V5R1:
            return 'v5R1';
        default:
            return null;
    }
};

export const toWalletSource = (account: Account): TransactionSentWalletSource => {
    switch (account.type) {
        case 'mnemonic':
        case 'mam':
        case 'testnet':
            return 'mnemonic';
        case 'sk':
            return 'privatekey';
        case 'ton-only':
            return 'signer';
        case 'ledger':
            return 'ledger';
        case 'keystone':
            return 'keystone';
        case 'watch-only':
            return 'watchonly';
        case 'ton-multisig':
            return 'mnemonic';
    }
};

// We always send transactions as single-chain transactions, even when the account has active Tron wallet.
export const toWalletChain = (_account: Account): TransactionSentWalletChain => {
    return 'single';
};
