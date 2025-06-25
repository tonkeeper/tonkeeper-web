import { Network } from '@tonkeeper/core/dist/entries/network';
import { Analytics, getUserIdentityProps } from './common';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { UserIdentity } from '@tonkeeper/core/dist/user-identity';
import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';

export class Aptabase implements Analytics {
    private user_properties: Record<string, string | number | boolean> = {};

    private readonly apiUrl: string;

    private readonly appKey: string;

    private readonly appVersion: string;

    private readonly userIdentity: UserIdentity;

    constructor(options: {
        host: string;
        key: string;
        appVersion: string;
        userIdentity: UserIdentity;
    }) {
        this.apiUrl = `${options.host}/api/v0/event`;
        this.appKey = options.key;
        this.appVersion = options.appVersion;
        this.userIdentity = options.userIdentity;
        this.track.bind(this);
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
        this.user_properties.version = this.appVersion;
        if (params.platform) {
            this.user_properties.platform = params.platform;
        }
    };

    track(name: string, params?: Record<string, string | number | boolean>): Promise<void>;
    track(event: AnalyticsEvent): Promise<void>;
    track(
        arg1: string | AnalyticsEvent,
        arg2?: Record<string, string | number | boolean>
    ): Promise<void> {
        if (typeof arg1 === 'string') {
            return this.trackEvent(arg1.toLowerCase(), {
                ...this.user_properties,
                ...(arg2 ?? {})
            });
        } else {
            const { name, ...props } = arg1;
            return this.trackEvent(name, { ...this.user_properties, ...props });
        }
    }

    private async trackEvent(
        eventName: string,
        props?: Record<string, string | number | boolean>
    ): Promise<void> {
        try {
            const identityProps = await getUserIdentityProps(this.userIdentity);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'App-Key': this.appKey
                },
                credentials: 'omit',
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    eventName: eventName,
                    systemProps: {
                        locale: this.getBrowserLocale(),
                        isDebug: this.isDebug,
                        appVersion: this.appVersion,
                        sdkVersion: 'custom_0.0.1'
                    },
                    props: {
                        osName: this.getUserOS(),
                        ...props
                    },
                    ...identityProps
                })
            });

            if (response.status >= 300) {
                const responseBody = await response.text();
                console.warn(
                    `Failed to send event "${eventName}": ${response.status} ${responseBody}`
                );
            }
        } catch (e) {
            console.warn(`Failed to send event "${eventName}"`);
            console.warn(e);
        }
    }

    private getBrowserLocale(): string | undefined {
        if (typeof navigator === 'undefined') {
            return undefined;
        }

        if (navigator.languages.length > 0) {
            return navigator.languages[0];
        } else {
            return navigator.language;
        }
    }

    private isDebug(): boolean {
        return process.env.NODE_ENV === 'development';
    }

    private getUserOS() {
        if (navigator.userAgent.includes('Win')) {
            return 'Windows';
        }
        if (
            navigator.userAgent.includes('iPhone') ||
            navigator.userAgent.includes('iPad') ||
            navigator.userAgent.includes('iPod')
        ) {
            return 'iOS';
        }
        if (navigator.userAgent.includes('Mac')) {
            return 'macOS';
        }
        if (navigator.userAgent.includes('Linux')) {
            return 'Linux';
        }
        if (navigator.userAgent.includes('Android')) {
            return 'Android';
        }

        return 'Unknown';
    }
}
