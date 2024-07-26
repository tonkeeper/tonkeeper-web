import { Analytics } from '@tonkeeper/uikit/dist/hooks/analytics';
import { sendBackground } from '../event';
import { Account } from "@tonkeeper/core/dist/entries/account";
import { Network } from "@tonkeeper/core/dist/entries/network";

export class AptabaseExtension implements Analytics {
    init =  (params: {
        application: string;
        walletType: string;
        activeAccount: Account;
        accounts: Account[];
        network?: Network;
        version?: string;
        platform?: string;
    }) => {
        sendBackground.message('userProperties', {
            application: params.application,
            walletType: params.walletType,
            accounts: params.accounts,
            activeAccount: params.activeAccount,
            version: params.version,
            network: params.network,
            platform: params.platform
        });
    };

    pageView = (location: string) => {
        sendBackground.message('locations', location);
    };

    track = async (name: string, params: Record<string, any>) => {
        sendBackground.message('trackEvent', { name, params });
    };
}
