import { UserIdentity } from '@tonkeeper/core/dist/user-identity';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import {
    isStandardTonWallet,
    TonContract,
    walletVersionText
} from '@tonkeeper/core/dist/entries/wallet';
import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';

/**
 * Events still tracked from app code but not defined in
 * tonkeeper/analytics-schemas.
 * @deprecated
 */
export type LegacyAnalyticsEvent =
    | { eventName: 'page_view'; location: string }
    | {
          eventName: 'dapp_click';
          url: string;
          location: string;
          from: 'banner' | 'browser' | 'browser_search' | 'browser_connected' | 'push' | 'sidebar';
      };

export type TrackableEvent = AnalyticsEvent | LegacyAnalyticsEvent;

export type AnalyticsTracker = {
    (event: TrackableEvent): Promise<void>;
    /**
     * Escape hatch for call sites whose event shape doesn't match the
     * analytics-schemas definition (the event name may already exist upstream
     * but with stricter required fields). Migrate these to typed events.
     *
     * @deprecated only events from analytics-schemas should be used
     */
    (name: string, params?: Record<string, string | number | boolean>): Promise<void>;
};

export const normalizeDeprecatedEventName = (eventName: string): string => eventName.toLowerCase();

export type AnalyticsIdentityProps = {
    uuid_persistent: string;
    sessionId: string;
    firebase_user_id?: string;
};

export async function getUserIdentityProps(
    userIdentity: UserIdentity
): Promise<AnalyticsIdentityProps> {
    const uuid_persistent = await userIdentity.getPersistentUserId();
    const sessionId = await userIdentity.getSessionId();

    const result: AnalyticsIdentityProps = {
        uuid_persistent,
        sessionId
    };

    if (userIdentity.getFirebaseUserId) {
        result.firebase_user_id = await userIdentity.getFirebaseUserId();
    }

    return result;
}

export interface Analytics {
    init: (params: {
        application: string;
        walletType: string;
        activeAccount?: Account;
        accounts: Account[];
        network?: Network;
        platform?: string;
    }) => void;
    track: AnalyticsTracker;
}

export const toWalletType = (wallet?: TonContract | null): string => {
    if (!wallet) return 'new-user';
    if (!isStandardTonWallet(wallet)) {
        return 'unknown-contract';
    }
    return walletVersionText(wallet.version);
};
