import {
    isStandardTonWallet,
    WalletsState,
    WalletState,
    walletVersionText
} from '@tonkeeper/core/dist/entries/wallet';

export interface Analytics {
    pageView: (location: string) => void;

    init: (
        application: string,
        walletType: string,
        activeWallet?: WalletState,
        wallets?: WalletsState,
        version?: string,
        platform?: string
    ) => void;
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

    init(
        application: string,
        walletType: string,
        activeWallet?: WalletState,
        wallets?: WalletsState,
        version?: string,
        platform?: string
    ) {
        this.analytics.forEach(c =>
            c.init(application, walletType, activeWallet, wallets, version, platform)
        );
    }

    async track(name: string, params: Record<string, any>) {
        return Promise.all(this.analytics.map(c => c.track(name, params))).then(() => undefined);
    }
}

export const toWalletType = (wallet?: WalletState | null): string => {
    if (!wallet) return 'new-user';
    if (!isStandardTonWallet(wallet)) {
        return 'multisend';
    }
    return walletVersionText(wallet.version);
};
