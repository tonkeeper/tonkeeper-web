import * as amplitude from '@amplitude/analytics-browser';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { WalletsState, WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Analytics } from '.';

export class Amplitude implements Analytics {
    constructor(private key: string, private userId?: string) {}

    init(
        application: string,
        walletType: string,
        activeWallet?: WalletState,
        wallets?: WalletsState,
        version?: string,
        platform?: string
    ) {
        amplitude.init(this.key, this.userId, {
            defaultTracking: {
                sessions: true,
                pageViews: true,
                formInteractions: false,
                fileDownloads: false
            }
        });

        const event = new amplitude.Identify();
        event.set('application', application ?? 'Unknown');
        event.set('walletType', walletType);
        event.set('network', activeWallet?.network === Network.TESTNET ? 'testnet' : 'mainnet');
        event.set('accounts', wallets?.length ?? 0);
        event.set('version', version ?? 'Unknown');
        event.set('platform', platform ?? 'Unknown');

        amplitude.identify(event);
    }

    pageView(location: string) {
        const eventProperties = {
            pathname: location
        };
        amplitude.track('Page View', eventProperties);
    }

    async track(name: string, params: Record<string, any>) {
        amplitude.track(name.replaceAll('_', ' '), params);
    }
}
