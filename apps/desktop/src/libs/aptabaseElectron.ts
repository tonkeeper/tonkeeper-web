import { trackEvent } from '@aptabase/electron/renderer';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { Analytics } from '@tonkeeper/uikit/dist/hooks/analytics';

export class AptabaseElectron implements Analytics {
    private user_properties: Record<string, any> = {};

    init = (
        application: string,
        walletType: string,
        account?: any,
        wallet?: any,
        version?: string | undefined,
        platform?: string | undefined
    ) => {
        this.user_properties['application'] = application;
        this.user_properties['walletType'] = walletType;
        this.user_properties['network'] =
            wallet?.network === Network.TESTNET ? 'testnet' : 'mainnet';
        this.user_properties['accounts'] = account!.publicKeys.length;
        this.user_properties['version'] = version;
        this.user_properties['platform'] = platform;
    };

    pageView = (location: string) => {
        trackEvent('page_view', { ...this.user_properties, location });
    };

    track = async (name: string, params: Record<string, any>) => {
        trackEvent(name.toLowerCase(), { ...this.user_properties, ...params });
    };
}
