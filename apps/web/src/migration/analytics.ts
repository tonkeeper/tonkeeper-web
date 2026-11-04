import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { AccountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import { getServerConfig, Tonendpoint } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { Aptabase, toWalletType } from '@tonkeeper/uikit/dist/hooks/analytics';

export type DomainMigrationEvent = Extract<
    AnalyticsEvent,
    { eventName: `domain_migration_${string}` }
>;

/**
 * How long a step that leaves the page waits for its event. The check's bounce
 * and the wallet opening after an import both navigate away, which would cancel
 * a request still in flight; past this the navigation goes ahead without it.
 */
const SEND_TIMEOUT_MS = 1500;

let tracker: Promise<Aptabase | undefined> | undefined;

/**
 * Usually nothing: the check runs only without wallets, and `/migrate` comes
 * before the import. A profile that has wallets and opens `/migrate` by hand
 * still reports them, like the app's own tracker would.
 */
const readAccounts = async (sdk: IAppSdk): Promise<{ accounts: Account[]; active?: Account }> => {
    try {
        const storage = new AccountsStorage(sdk.storage);
        const accounts = await storage.getAccounts();
        const activeId = await storage.getActiveAccountId();

        return { accounts, active: accounts.find(account => account.id === activeId) };
    } catch {
        return { accounts: [] };
    }
};

/**
 * The app's own tracker is created inside the wallet shell, once an account
 * exists, so nothing the migration screens do before the first wallet would be
 * seen. This one reads the analytics endpoint from the same boot config and
 * shares the app's identity, so its events join the rest of the user's.
 *
 * Built once per page load. A boot config that can't be loaded means no
 * migration events, never a migration that waits on analytics.
 */
export const startMigrationTracking = (sdk: IAppSdk): Promise<Aptabase | undefined> => {
    if (!tracker) {
        const tonendpoint = new Tonendpoint({
            build: sdk.version,
            network: Network.MAINNET,
            lang: 'en',
            platform: 'web'
        });

        tracker = Promise.all([getServerConfig(tonendpoint, Network.MAINNET), readAccounts(sdk)])
            .then(([config, { accounts, active }]) => {
                if (!config.aptabaseEndpoint || !config.aptabaseKey) {
                    return undefined;
                }

                const aptabase = new Aptabase({
                    host: config.aptabaseEndpoint,
                    key: config.aptabaseKey,
                    appVersion: sdk.version,
                    userIdentity: sdk.userIdentity
                });

                aptabase.init({
                    application: 'Web',
                    walletType: toWalletType(active?.activeTonWallet),
                    activeAccount: active,
                    accounts,
                    network: Network.MAINNET
                });

                return aptabase;
            })
            .catch(() => undefined);
    }

    return tracker;
};

/**
 * Resolves once the event is sent, or after `SEND_TIMEOUT_MS`, whichever comes
 * first, and never rejects. Await it only before leaving the page.
 */
export const trackMigration = async (sdk: IAppSdk, event: DomainMigrationEvent): Promise<void> => {
    const sent = startMigrationTracking(sdk)
        .then(aptabase => aptabase?.track(event))
        .catch(() => undefined);

    await Promise.race([sent, new Promise(resolve => setTimeout(resolve, SEND_TIMEOUT_MS))]);
};

let pendingCheckAnswer: 'none' | undefined;

/**
 * The old origin's "nothing here" is settled in `index.tsx` before the app and
 * its SDK exist, so it is noted there and sent once the check gate mounts.
 */
export const noteCheckAnswerNone = () => {
    pendingCheckAnswer = 'none';
};

export const takeCheckAnswer = (): 'none' | undefined => {
    const answer = pendingCheckAnswer;
    pendingCheckAnswer = undefined;
    return answer;
};
