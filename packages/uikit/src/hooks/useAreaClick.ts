import { PromotedApp } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { DAppSource, formatBrowserUrl, DAppTrack } from '@tonkeeper/core/dist/service/urlService';
import { useCallback, useRef } from 'react';
import { useAppSdk } from './appSdk';
import { useEventListener } from './useEventListener';
import { catalogDappIdentity, useTrackDappAppClick } from './analytics/dapp-browser';
import { useActiveConfig } from '../state/wallet';

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

/**
 * Opens a catalog dApp of the legacy Browser pages in the external browser.
 * Takes the whole catalog entry, not just its URL — `dapp_app_click` reports
 * the backend app and campaign ids alongside it.
 */
export function useOpenPromotedAppInExternalBrowser(app: PromotedApp, source: DAppSource) {
    const sdk = useAppSdk();
    const trackDappAppClick = useTrackDappAppClick();
    const config = useActiveConfig();

    return useCallback(() => {
        trackDappAppClick({
            ...catalogDappIdentity(app),
            from: source === 'featured' ? 'banner' : 'browser'
        });
        sdk.openPage(formatBrowserUrl(app.url, source, config.tonkeeper_utm_track as DAppTrack), {
            forceExternalBrowser: true
        });
    }, [app, sdk, trackDappAppClick, config.tonkeeper_utm_track, source]);
}
