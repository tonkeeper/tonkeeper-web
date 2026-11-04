import { Account } from '../entries/account';
import { WalletVersion } from '../entries/wallet';
import { AnalyticsAssetId, assetIdChain } from './asset-id';
import { WalletInterfaceSchema } from './generated/models/WalletInterfaceSchema';
import { WalletModeSchema } from './generated/models/WalletModeSchema';
import { WalletSourceSchema } from './generated/models/WalletSourceSchema';

export type AnalyticsWalletSource = WalletSourceSchema;
export type AnalyticsWalletMode = WalletModeSchema;
export type AnalyticsWalletInterface = WalletInterfaceSchema;

export const toWalletInterface = (version: WalletVersion): AnalyticsWalletInterface => {
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
    }
};

/**
 * `wallet_interface` vocabulary is per-chain: TON reports its contract version,
 * Bitcoin its address encoding, and every other chain its account model. Which
 * one applies is read from the chain of the transaction's asset.
 */
export const toTransactionWalletInterface = (
    assetId: AnalyticsAssetId,
    tonWalletVersion: WalletVersion
): AnalyticsWalletInterface => {
    switch (assetIdChain(assetId)) {
        case 'ton':
            return toWalletInterface(tonWalletVersion);
        // Wallets derive one BTC address, native SegWit — chain-kit rejects
        // every other encoding, so there is nothing else to report.
        case 'btc':
            return 'segwit';
        default:
            return 'eoa';
    }
};

export const toWalletSource = (account: Account): AnalyticsWalletSource => {
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
        case 'multichain':
            return 'mnemonic';
    }
};

export const toWalletMode = (account: Account): AnalyticsWalletMode =>
    account.type === 'multichain' ? 'multi' : 'single';
