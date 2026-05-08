import { init, trackEvent } from '@aptabase/web';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { UserIdentity } from '@tonkeeper/core/dist/user-identity';
import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import { Analytics, getUserIdentityProps } from './common';

export class Aptabase implements Analytics {
    private user_properties: Record<string, string | number | boolean> = {};

    private readonly userIdentity: UserIdentity;

    constructor(options: {
        host: string;
        key: string;
        appVersion: string;
        userIdentity: UserIdentity;
    }) {
        init(options.key, {
            apiUrl: `${options.host}/api/v0/event`,
            appVersion: options.appVersion
        });
        this.userIdentity = options.userIdentity;
        this.track = this.track.bind(this);
    }

    init = (params: {
        application: string;
        walletType: string;
        activeAccount: Account;
        accounts: Account[];
        network?: Network;
        platform?: string;
    }) => {
        this.user_properties.application = params.application;
        this.user_properties.walletType = params.walletType;
        this.user_properties.network = params.network === Network.TESTNET ? 'testnet' : 'mainnet';
        this.user_properties.accounts = params.accounts?.length ?? 0;
        if (params.platform) {
            this.user_properties.platform = params.platform;
        }
    };

    track(name: string, params?: Record<string, string | number | boolean>): Promise<void>;
    track(event: AnalyticsEvent): Promise<void>;
    async track(
        arg1: string | AnalyticsEvent,
        arg2?: Record<string, string | number | boolean>
    ): Promise<void> {
        const eventName = typeof arg1 === 'string' ? arg1.toLowerCase() : arg1.name;
        const eventProps =
            typeof arg1 === 'string'
                ? arg2 ?? {}
                : (() => {
                      const { name, ...rest } = arg1;
                      return rest as Record<string, string | number | boolean>;
                  })();

        const { sessionId, ...identityProps } = await getUserIdentityProps(this.userIdentity);

        return trackEvent(eventName, {
            ...this.user_properties,
            ...eventProps,
            ...identityProps,
            app_session_id: sessionId
        });
    }
}
