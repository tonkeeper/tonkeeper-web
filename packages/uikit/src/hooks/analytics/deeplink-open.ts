import { useCallback, useEffect } from 'react';

import { AnalyticsEventDeeplinkOpen } from '@tonkeeper/core/dist/analytics';
import { toDeeplinkOpenEvent } from '@tonkeeper/core/dist/analytics/deeplink-open';

import { useValueRef } from '../../libs/common';
import { useAppContext } from '../appContext';
import { useAnalyticsTrack } from './index';

/**
 * A cold-start link reaches the shell before the tracker query resolves, and
 * `track` no-ops until it does. Module-level so a shell root remount doesn't
 * lose the backlog.
 */
const pendingOpens: AnalyticsEventDeeplinkOpen[] = [];

/**
 * Reports a link that reached the app from outside. Call it only from the shell
 * entry points that receive OS / browser links — scans, banners and other
 * in-app links go through the same handlers but report their own placement.
 *
 * The returned callback is stable: shells register it with link listeners that
 * are never unsubscribed, so a changing identity would stack duplicates.
 */
export const useTrackDeeplinkOpen = () => {
    const { tracker } = useAppContext();
    const track = useAnalyticsTrack();
    const trackerRef = useValueRef({ tracker, track });

    useEffect(() => {
        if (!tracker) return;
        pendingOpens.splice(0).forEach(event => void track(event));
    }, [tracker, track]);

    return useCallback(
        (link: string, isColdStart: boolean) => {
            const event = toDeeplinkOpenEvent(link, isColdStart);
            if (!event) return;
            const current = trackerRef.current;
            if (current.tracker) {
                void current.track(event);
            } else {
                pendingOpens.push(event);
            }
        },
        [trackerRef]
    );
};
