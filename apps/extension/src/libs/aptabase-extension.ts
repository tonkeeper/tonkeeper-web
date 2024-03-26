import { Analytics } from '@tonkeeper/uikit/dist/hooks/analytics';
import { sendBackground } from '../event';

export class AptabaseExtension implements Analytics {
    init = (
        application: string,
        walletType: string,
        account?: any,
        wallet?: any,
        version?: string | undefined,
        platform?: string | undefined
    ) => {
        sendBackground.message('userProperties', {
            application,
            walletType,
            account,
            wallet,
            version,
            platform
        });
    };

    pageView = (location: string) => {
        sendBackground.message('locations', location);
    };

    track = async (name: string, params: Record<string, any>) => {
        sendBackground.message('trackEvent', { name, params });
    };
}
