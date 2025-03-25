import { init, trackEvent } from '@aptabase/browser';
import { Network } from '@tonkeeper/core/dist/entries/network';
import browser from 'webextension-polyfill';
import { UserProperties } from '../event';

export class AptabaseExtensionService {
    private user_properties: Record<string, any> = {};

    constructor() {
        const host = process.env.REACT_APP_APTABASE_HOST!;
        const key = process.env.REACT_APP_APTABASE!;
        const { version } = browser.runtime.getManifest();

        init(key, { appVersion: version, host: host, isDebug: false }).catch(e => console.warn(e));
    }

    init = (params: UserProperties) => {
        this.user_properties['application'] = params.application;
        this.user_properties['walletType'] = params.walletType;
        this.user_properties['network'] =
            params.network === Network.TESTNET ? 'testnet' : 'mainnet';
        this.user_properties['accounts'] = params.accounts?.length || 0;
        this.user_properties['version'] = params.version;
        this.user_properties['platform'] = params.platform;
    };

    pageView = (location: string) => {
        trackEvent('page_view', { ...this.user_properties, location }).catch(e => console.warn(e));
    };

    track = async (name: string, params: Record<string, any>) => {
        trackEvent(name.toLowerCase(), { ...this.user_properties, ...params }).catch(e =>
            console.warn(e)
        );
    };
}
