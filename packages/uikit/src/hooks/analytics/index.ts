import {
    isStandardTonWallet,
    walletVersionText,
    Account,
    TonWalletStandard
} from '@tonkeeper/core/dist/entries/wallet';
import { Network } from '@tonkeeper/core/dist/entries/network';

export interface Analytics {
    pageView: (location: string) => void;

    init: (params: {
        application: string;
        walletType: string;
        activeAccount: Account;
        accounts: Account[];
        network?: Network;
        version?: string;
        platform?: string;
    }) => void;
    track: (name: string, params: Record<string, any>) => Promise<void>;
}

export class AnalyticsGroup implements Analytics {
    private analytics: Analytics[];

    constructor(...items: Analytics[]) {
        this.analytics = items;
    }

    pageView(location: string) {
        this.analytics.forEach(c => c.pageView(location));
    }

    init(params: {
        application: string;
        walletType: string;
        activeAccount: Account;
        accounts: Account[];
        network?: Network;
        version?: string;
        platform?: string;
    }) {
        this.analytics.forEach(c => c.init(params));
    }

    async track(name: string, params: Record<string, any>) {
        return Promise.all(this.analytics.map(c => c.track(name, params))).then(() => undefined);
    }
}

export const toWalletType = (wallet?: TonWalletStandard | null): string => {
    if (!wallet) return 'new-user';
    if (!isStandardTonWallet(wallet)) {
        return 'multisend';
    }
    return walletVersionText(wallet.version);
};
