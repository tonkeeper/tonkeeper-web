import { DAppSource, formatBrowserUrl } from '@tonkeeper/core/dist/service/urlService';
import { useCallback, useRef } from 'react';
import { useAppSdk } from './appSdk';
import { useEventListener } from './useEventListener';
import { useAppContext } from './appContext';
import { useCountryContextTracker } from './analytics/events-hooks';
import { AnalyticsEventDappClick } from '@tonkeeper/core/dist/analytics';

export function useAreaClick<T extends HTMLElement = HTMLDivElement>({
    callback,
    precisionXPx,
    precisionYPx
}: {
    callback: () => void;
    precisionXPx?: number;
    precisionYPx?: number;
}) {
    const clickedPosition = useRef<{ clientX: number; clientY: number }>({
        clientX: 0,
        clientY: 0
    });

    const ref = useRef<T | null>(null);

    const onMouseDown = useCallback((e: MouseEvent) => {
        clickedPosition.current = {
            clientY: e.clientY,
            clientX: e.clientX
        };
    }, []);

    const onMouseUp = useCallback(
        (e: MouseEvent) => {
            const xInArea =
                Math.abs(e.clientX - clickedPosition.current.clientX) < (precisionXPx ?? 10);
            const yInArea =
                Math.abs(e.clientY - clickedPosition.current.clientY) < (precisionYPx ?? 10);
            if (xInArea && yInArea) {
                callback();
            }
        },
        [callback, precisionXPx, precisionYPx]
    );

    useEventListener<'mousedown', HTMLElement>('mousedown', onMouseDown, ref!);
    useEventListener('mouseup', onMouseUp, ref!);

    return ref;
}

export function useOpenPromotedAppInExternalBrowser(url: string, source: DAppSource) {
    const sdk = useAppSdk();
    const track = useCountryContextTracker();
    const { tonendpoint } = useAppContext();

    return useCallback(() => {
        track(
            (country: string) =>
                new AnalyticsEventDappClick({
                    from: source === 'featured' ? 'banner' : 'browser',
                    url: url,
                    location: country
                })
        );
        sdk.openPage(formatBrowserUrl(url, source, tonendpoint.getTrack()), {
            forceExternalBrowser: true
        });
    }, [url, sdk, track, tonendpoint]);
}
