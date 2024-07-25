import * as amplitude from '@amplitude/analytics-browser';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Analytics } from '.';

export class Amplitude implements Analytics {
    constructor(private key: string, private userId?: string) {}

    init(params: {
        application: string;
        walletType: string;
        activeAccount: Account;
        accounts: Account[];
        network?: Network;
        version?: string;
        platform?: string;
    }) {
        amplitude.init(this.key, this.userId, {
            defaultTracking: {
                sessions: true,
                pageViews: true,
                formInteractions: false,
                fileDownloads: false
            }
        });

        const event = new amplitude.Identify();
        event.set('application', params.application ?? 'Unknown');
        event.set('walletType', params.walletType);
        event.set('network', params.network === Network.TESTNET ? 'testnet' : 'mainnet');
        event.set('accounts', params.accounts?.length ?? 0);
        event.set('version', params.version ?? 'Unknown');
        event.set('platform', params.platform ?? 'Unknown');

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
