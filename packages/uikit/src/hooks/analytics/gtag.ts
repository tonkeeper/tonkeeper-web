import { AccountState } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import ReactGA from 'react-ga4';
import { Analytics } from '.';

export class Gtag implements Analytics {
    constructor(private measurementId: string) {
        ReactGA.initialize(this.measurementId);
    }

    init(
        application: string,
        walletType: string,
        account?: AccountState,
        wallet?: WalletState | null,
        version?: string,
        platform?: string
    ) {
        ReactGA.gtag('set', 'user_properties', {
            application,
            walletType,
            network: wallet?.network === Network.TESTNET ? 'testnet' : 'mainnet',
            accounts: account!.publicKeys.length,
            version,
            platform
        });
    }

    pageView(location: string) {
        ReactGA.send({ hitType: 'pageview', page: location });
    }

    async track(name: string, params: Record<string, any>) {
        ReactGA.event(name, params);
    }
}
