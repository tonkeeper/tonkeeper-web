import { useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import { useAppContext } from '../appContext';
import { AnalyticsTracker, TrackableEvent } from './common';

export { Aptabase } from './aptabase';
export { type Analytics, toWalletType } from './common';

// Temporary: the useMemo + overloaded `function track` shape exists only to
// support the deprecated 2-arg `track(name, params)` call signature. Once the
// remaining legacy call sites are migrated to typed object events, drop the
// string overload from AnalyticsTracker and collapse this back to a plain
// `useCallback` returning `(event: TrackableEvent) => Promise<void>`.
export const useAnalyticsTrack = (): AnalyticsTracker => {
    const { tracker } = useAppContext();

    return useMemo<AnalyticsTracker>(() => {
        function track(event: TrackableEvent): Promise<void>;
        function track(
            name: string,
            params?: Record<string, string | number | boolean>
        ): Promise<void>;
        async function track(
            arg1: TrackableEvent | string,
            arg2?: Record<string, string | number | boolean>
        ): Promise<void> {
            if (!tracker) return;
            try {
                if (typeof arg1 === 'string') {
                    await tracker(arg1, arg2);
                } else {
                    await tracker(arg1);
                }
            } catch (e) {
                console.error(e);
            }
        }
        return track;
    }, [tracker]);
};

export const useTrackLocation = () => {
    const location = useLocation();
    const track = useAnalyticsTrack();

    useEffect(() => {
        track({ eventName: 'page_view', location: location.pathname });
    }, [track, location.pathname]);
};
