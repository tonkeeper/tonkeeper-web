import { Network } from '@tonkeeper/core/dist/entries/network';
import { Account } from '@tonkeeper/core/dist/entries/account';
import ReactGA from 'react-ga4';
import { Analytics } from '.';

export class Gtag implements Analytics {
    constructor(private measurementId: string) {
        ReactGA.initialize(this.measurementId);
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
        ReactGA.gtag('set', 'user_properties', {
            application: params.application,
            walletType: params.walletType,
            network: params.network === Network.TESTNET ? 'testnet' : 'mainnet',
            accounts: params.accounts.length,
            version: params.version,
            platform: params.version
        });
    }

    pageView(location: string) {
        ReactGA.send({ hitType: 'pageview', page: location });
    }

    async track(name: string, params: Record<string, any>) {
        ReactGA.event(name, params);
    }
}
