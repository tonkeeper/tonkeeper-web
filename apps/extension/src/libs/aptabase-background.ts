import { init, trackEvent } from '@aptabase/browser';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { UserIdentity } from '@tonkeeper/core/dist/user-identity';
import { getOsName } from '@tonkeeper/core/dist/analytics/os';
import {
    Analytics,
    TrackableEvent,
    normalizeDeprecatedEventName
} from '@tonkeeper/uikit/dist/hooks/analytics/common';

export class AptabaseBackground implements Analytics {
    private user_properties: Record<string, string | number | boolean> = {};

    private readonly userIdentity: UserIdentity;

    private readonly aptabaseInitPromise: Promise<void>;

    constructor(options: {
        host: string;
        key: string;
        appVersion: string;
        userIdentity: UserIdentity;
    }) {
        this.aptabaseInitPromise = init(options.key, {
            apiUrl: `${options.host}/api/v0/event`,
            appVersion: options.appVersion
        });
        this.userIdentity = options.userIdentity;
        const osName = getOsName();
        if (osName) this.user_properties.osName = osName;
        this.track = this.track.bind(this);
    }

    init = (params: {
        application: string;
        walletType: string;
        activeAccount?: Account;
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

    track(event: TrackableEvent): Promise<void>;
    track(name: string, params?: Record<string, string | number | boolean>): Promise<void>;
    async track(
        arg1: TrackableEvent | string,
        arg2?: Record<string, string | number | boolean>
    ): Promise<void> {
        const { eventName, eventProps } = (() => {
            if (typeof arg1 === 'string') {
                return { eventName: normalizeDeprecatedEventName(arg1), eventProps: arg2 ?? {} };
            }
            const { eventName: name, ...rest } = arg1;
            return {
                eventName: name,
                eventProps: rest as Record<string, string | number | boolean>
            };
        })();

        await this.aptabaseInitPromise;

        const uuid_persistent = await this.userIdentity.getPersistentUserId();
        const appSessionId = await this.userIdentity.getSessionId();
        const identity: Record<string, string | number | boolean> = {
            uuid_persistent,
            app_session_id: appSessionId
        };
        if (this.userIdentity.getFirebaseUserId) {
            identity.firebase_user_id = await this.userIdentity.getFirebaseUserId();
        }

        return trackEvent(eventName, {
            ...this.user_properties,
            ...eventProps,
            ...identity
        });
    }
}
