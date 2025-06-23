import { UserIdentity } from '@tonkeeper/core/dist/user-identity';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import {
    isStandardTonWallet,
    TonContract,
    walletVersionText
} from '@tonkeeper/core/dist/entries/wallet';

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
    pageView: (location: string) => void;

    init: (params: {
        application: string;
        walletType: string;
        activeAccount: Account;
        accounts: Account[];
        network?: Network;
        platform?: string;
    }) => void;
    track: (name: string, params: Record<string, string | number | boolean>) => Promise<void>;
}

export const toWalletType = (wallet?: TonContract | null): string => {
    if (!wallet) return 'new-user';
    if (!isStandardTonWallet(wallet)) {
        return 'unknown-contract';
    }
    return walletVersionText(wallet.version);
};
