import { DAppSource, formatBrowserUrl } from '@tonkeeper/core/dist/service/urlService';
import { useCallback, useRef } from 'react';
import { useClickBrowser } from './amplitude';
import { useAppSdk } from './appSdk';
import { useEventListener } from './useEventListener';
import { useAppContext } from './appContext';

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

export function useOpenPromotedAppCallback(url: string, source: DAppSource) {
    const sdk = useAppSdk();
    const event = useClickBrowser();
    const { tonendpoint } = useAppContext();

    return useCallback(() => {
        event(url, source);
        sdk.openPage(formatBrowserUrl(url, source, tonendpoint.getTrack()), {
            forceExternalBrowser: true
        });
    }, [url, sdk, event, tonendpoint]);
}
