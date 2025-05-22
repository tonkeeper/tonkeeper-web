import {
    isStandardTonWallet,
    walletVersionText,
    TonContract
} from '@tonkeeper/core/dist/entries/wallet';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
export { Aptabase } from './aptabase';

export interface Analytics {
    pageView: (location: string) => void;

    init: (params: {
        application: string;
        walletType: string;
        activeAccount: Account;
        accounts: Account[];
        network?: Network;
        platform?: string;
    }) => void;
    track: (name: string, params: Record<string, string | number | boolean>) => Promise<void>;
}

export const toWalletType = (wallet?: TonContract | null): string => {
    if (!wallet) return 'new-user';
    if (!isStandardTonWallet(wallet)) {
        return 'unknown-contract';
    }
    return walletVersionText(wallet.version);
};
