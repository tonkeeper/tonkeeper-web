import { useEffect } from 'react';

import { useAccountsStateQuery } from '../../state/accounts';
import { useAppContext } from '../appContext';
import { useAnalyticsTrack } from './index';

/**
 * The latch is module-level, not a ref: a shell that swaps its root component
 * on a layout change (web crossing the desktop breakpoint, mobile switching
 * between the wide and narrow content) remounts the hook without the app having
 * been opened again. One page context is one launch.
 */
let launchReported = false;

/**
 * Reports the app opening, once per page context.
 *
 * `wallets_count` counts accounts — one per wallet the user added — so a MAM
 * account's derived wallets and a multichain account's per-chain wallets each
 * count once.
 *
 * Mounted next to `useTrackLocation` in each shell root.
 */
export const useTrackLaunchApp = () => {
    const { tracker } = useAppContext();
    const track = useAnalyticsTrack();
    const { data: accounts } = useAccountsStateQuery();

    useEffect(() => {
        // `track` no-ops until the tracker resolves, and the count is only
        // honest once the accounts have been read off storage — latching before
        // either would report the launch with nothing to say, or not at all.
        if (launchReported || !tracker || accounts === undefined) return;
        launchReported = true;

        track({ eventName: 'launch_app', wallets_count: accounts.length });
    }, [tracker, accounts, track]);
};
