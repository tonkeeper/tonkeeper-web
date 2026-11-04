import { FC, PropsWithChildren, useEffect, useRef, useState } from 'react';

import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useAccountsStateQuery } from '@tonkeeper/uikit/dist/state/wallet';

import { startMigrationTracking, takeCheckAnswer, trackMigration } from './analytics';
import {
    hasCheckedOldOrigin,
    isOldOriginReachable,
    markOldOriginAsked,
    resolveArrival
} from './arrival';
import { startOldOriginCheck } from './handoffRequest';

type GateState =
    /** Reading what this profile holds, before anything is decided. */
    | 'deciding'
    /** On the way to the old origin to ask it. */
    | 'checking'
    /** Nothing to ask, or the asking failed: the wallet boots as usual. */
    | 'open';

const askOldOrigin = (resumePath: string): string | undefined => {
    try {
        return startOldOriginCheck(resumePath);
    } catch {
        return undefined;
    }
};

/**
 * Stands between the app and its first paint on a profile that has no wallets
 * here yet, to find out whether the person's wallets are still on the origin
 * the app moved from.
 *
 * It runs once, and only in the one case that can need it — no accounts on this
 * origin and no answer from the old one yet. A profile with a wallet boots
 * straight through, as does one the old origin has already answered for, so
 * everyone past the migration window pays nothing for it.
 *
 * `Loading` covers the decision and the bounce alike: it is the same screen the
 * app shows while its own boot queries settle, so the whole check reads as one
 * slightly longer load. The old origin answers before it renders anything, and
 * the answer is settled before this app mounts again (`settleCheckAnswer`).
 */
export const OldOriginCheck: FC<PropsWithChildren> = ({ children }) => {
    const sdk = useAppSdk();
    const { data: accounts, isLoading } = useAccountsStateQuery();
    const [state, setState] = useState<GateState>('deciding');

    // A ref, not the rendered state, decides whether the check has begun. The
    // check reports progress by setting state, so anything that re-runs on
    // state would tear down the run that set it and leave the gate closed with
    // nothing left to open it.
    const started = useRef(false);

    useEffect(() => {
        if (isLoading || started.current) {
            return;
        }

        started.current = true;

        const answer = takeCheckAnswer();

        if (answer) {
            trackMigration(sdk, { eventName: 'domain_migration_check_answer', answer });
        }

        const check = async () => {
            const decision = resolveArrival({
                hasAccounts: Boolean(accounts?.length),
                hasChecked: await hasCheckedOldOrigin(sdk.storage),
                userAgent: navigator.userAgent
            });

            if (decision.kind === 'skip') {
                setState('open');
                return;
            }

            setState('checking');

            // Loaded alongside the ping, so the event below rarely holds up
            // the bounce.
            startMigrationTracking(sdk);

            // The path this visit was for is carried across the round trip in
            // session storage, so a dApp connect link survives the detour and
            // resumes once the wallets are here.
            const reachable = await isOldOriginReachable();
            const target = reachable
                ? askOldOrigin(window.location.pathname + window.location.search)
                : undefined;

            if (target) {
                // Recorded before leaving, so every way the round trip can end
                // without importing comes back to onboarding instead of to
                // another bounce.
                await markOldOriginAsked(sdk.storage);
                await trackMigration(sdk, { eventName: 'domain_migration_check', outcome: 'sent' });
                window.location.assign(target);
                return;
            }

            // The old origin is unreachable, or this browser won't let us keep
            // the request. Onboarding carries the way back in, and the check is
            // left unmarked so the next visit tries again.
            trackMigration(sdk, {
                eventName: 'domain_migration_check',
                outcome: reachable ? 'failed' : 'unreachable'
            });
            setState('open');
        };

        // Nothing here is allowed to keep the wallet from booting: an
        // unexpected failure opens the gate the same way an unreachable origin
        // does.
        check().catch(() => {
            trackMigration(sdk, { eventName: 'domain_migration_check', outcome: 'failed' });
            setState('open');
        });
    }, [isLoading, accounts, sdk]);

    switch (state) {
        case 'open':
            return <>{children}</>;
        case 'checking':
        case 'deciding':
            return <Loading />;
    }
};
