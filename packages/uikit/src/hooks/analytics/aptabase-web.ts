import { init, trackEvent } from '@aptabase/web';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { Analytics } from '.';
import { Account } from '@tonkeeper/core/dist/entries/account';

export class AptabaseWeb implements Analytics {
    private user_properties: Record<string, any> = {};

    constructor(private host: string, private key: string, appVersion?: string) {
        init(this.key, { appVersion, host: this.host });
    }

    init = (params: {
        application: string;
        walletType: string;
        activeAccount: Account;
        accounts: Account[];
        network?: Network;
        version?: string;
        platform?: string;
    }) => {
        this.user_properties.application = params.application;
        this.user_properties.walletType = params.walletType;
        this.user_properties.network = params.network === Network.TESTNET ? 'testnet' : 'mainnet';
        this.user_properties.accounts = params.accounts?.length ?? 0;
        this.user_properties.version = params.version;
        this.user_properties.platform = params.platform;
    };

    pageView = (location: string) => {
        trackEvent('page_view', { ...this.user_properties, location });
    };

    track = async (name: string, params: Record<string, any>) => {
        trackEvent(name.toLowerCase(), { ...this.user_properties, ...params });
    };
}
