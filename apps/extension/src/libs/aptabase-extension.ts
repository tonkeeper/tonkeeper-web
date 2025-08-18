import { Analytics } from '@tonkeeper/uikit/dist/hooks/analytics';
import { sendBackground } from '../event';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';

export class AptabaseExtension implements Analytics {
    constructor(
        private readonly aptabaseEndpoint: string,
        private readonly aptabaseKey: string | undefined
    ) {
        this.track = this.track.bind(this);
    }

    init = (params: {
        application: string;
        walletType: string;
        activeAccount: Account;
        accounts: Account[];
        network?: Network;
    }) => {
        sendBackground.message('userProperties', {
            application: params.application,
            walletType: params.walletType,
            accounts: params.accounts,
            activeAccount: params.activeAccount,
            network: params.network,
            aptabaseKey: this.aptabaseKey,
            aptabaseEndpoint: this.aptabaseEndpoint
        });
    };

    track(name: string, params?: Record<string, string | number | boolean>): Promise<void>;
    track(event: AnalyticsEvent): Promise<void>;
    track(
        arg1: string | AnalyticsEvent,
        arg2?: Record<string, string | number | boolean>
    ): Promise<void> {
        if (typeof arg1 === 'string') {
            sendBackground.message('trackEvent', { name: arg1, params: arg2 ?? {} });
        } else {
            const { name, ...params } = arg1;
            sendBackground.message('trackEvent', { name, params });
        }
        return Promise.resolve();
    }
}
