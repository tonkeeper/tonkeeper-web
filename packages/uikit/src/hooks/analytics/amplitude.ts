import * as amplitude from '@amplitude/analytics-browser';
import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Analytics } from '.';

export class Amplitude implements Analytics {
    constructor(private key: string) {}

    init(
        application: string,
        walletType: string,
        account?: AccountState,
        wallet?: WalletState | null
    ) {
        amplitude.init(this.key, undefined, {
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
        event.set('network', wallet?.network === Network.TESTNET ? 'testnet' : 'mainnet');
        event.set('accounts', account!.publicKeys.length);

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
