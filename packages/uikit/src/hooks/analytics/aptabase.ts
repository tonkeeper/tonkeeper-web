import { init, trackEvent } from '@aptabase/web';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { UserIdentity } from '@tonkeeper/core/dist/user-identity';
import { getOsName } from '@tonkeeper/core/dist/analytics/os';
import {
    Analytics,
    TrackableEvent,
    getUserIdentityProps,
    normalizeDeprecatedEventName
} from './common';

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
        const { eventName, props } = normalizeTrackArgs(arg1, arg2);
        const { sessionId, ...identityProps } = await getUserIdentityProps(this.userIdentity);

        return trackEvent(eventName, {
            ...this.user_properties,
            ...props,
            ...identityProps,
            app_session_id: sessionId
        });
    }
}

function normalizeTrackArgs(
    arg1: TrackableEvent | string,
    arg2?: Record<string, string | number | boolean>
): { eventName: string; props: Record<string, string | number | boolean> } {
    if (typeof arg1 === 'string') {
        return { eventName: normalizeDeprecatedEventName(arg1), props: arg2 ?? {} };
    }
    const { eventName, ...rest } = arg1;
    return {
        eventName,
        props: rest as Record<string, string | number | boolean>
    };
}
