import { Analytics, TrackableEvent } from '@tonkeeper/uikit/dist/hooks/analytics/common';
import { sendBackground } from '../event';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';

export class AptabaseExtension implements Analytics {
    constructor(private readonly aptabaseEndpoint: string, private readonly aptabaseKey: string) {
        this.track = this.track.bind(this);
    }

    init = (params: {
        application: string;
        walletType: string;
        activeAccount?: Account;
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

    track(event: TrackableEvent): Promise<void>;
    track(name: string, params?: Record<string, string | number | boolean>): Promise<void>;
    track(
        arg1: TrackableEvent | string,
        arg2?: Record<string, string | number | boolean>
    ): Promise<void> {
        if (typeof arg1 === 'string') {
            sendBackground.message('trackEvent', { name: arg1, params: arg2 ?? {} });
        } else {
            const { eventName, ...params } = arg1;
            sendBackground.message('trackEvent', {
                name: eventName,
                params: params as Record<string, string | number | boolean>
            });
        }
        return Promise.resolve();
    }
}
