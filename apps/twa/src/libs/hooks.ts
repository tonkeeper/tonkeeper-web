import { useQuery } from '@tanstack/react-query';
import { debounce } from '@tonkeeper/core/dist/utils/common';
import { Viewport } from '@twa.js/sdk';
import React, { useContext, useEffect } from 'react';
import { TwaAppSdk } from './appSdk';

export const ViewportContext = React.createContext<Viewport>(undefined!);

export const useSyncedViewport = (sdk: TwaAppSdk) => {
    return useQuery(['viewport'], async () => {
        const viewport = await Viewport.synced();

        sdk.setTwaExpand(() => {
            viewport.expand();
            return undefined;
        });

        return viewport;
    });
};

export const useAppViewport = () => {
    //const sdk = useAppSdk();
    const viewport = useContext(ViewportContext);

    useEffect(() => {
        const doc = document.documentElement;
        const visualViewport = window.visualViewport;

        const setWidth = (value: number) => {
            doc.style.setProperty('--app-width', `${value}px`);
        };

        const setHeight = (value: number) => {
            // sdk.uiEvents.emit('copy', { method: 'copy', params: `height ${value}px` });

            doc.style.setProperty('--app-height', `${value}px`);
        };

        const callback = () => {
            if (visualViewport) {
                resizeHandler.call(visualViewport);
            }
        };

        const resizeHandler = debounce(function (this: VisualViewport) {
            setHeight(this.height);
        }, 200);

        setHeight(viewport.height);
        setWidth(viewport.width);

        viewport.on('heightChanged', setHeight);
        viewport.on('widthChanged', setWidth);

        if (visualViewport) {
            resizeHandler.call(viewport);
            visualViewport.addEventListener('resize', resizeHandler);
            window.addEventListener('resize', callback);
        }

        return () => {
            viewport.off('heightChanged', setHeight);
            viewport.off('widthChanged', setWidth);

            visualViewport?.removeEventListener('resize', resizeHandler);
            window.removeEventListener('resize', callback);
        };
    }, []);
};

export const useKeyboardHeight = () => {
    useEffect(() => {
        // const message = (value: string) =>
        //     sdk.uiEvents.emit('copy', { method: 'copy', params: value });

        const innerHeight = window.innerHeight;
        const viewport = window.visualViewport;

        function callback() {
            // message('callback');
            if (viewport) {
                resizeHandler.call(viewport);
            }
        }

        function releaseHandler() {
            const doc = document.documentElement;
            doc.style.setProperty('--app-height', `${innerHeight}px`);
            doc.style.setProperty('--fixed-height', 'auto');
            // message('release');
        }

        const resizeHandler = debounce(function (this: VisualViewport) {
            if (this.height > 500) {
                return releaseHandler();
            } else {
                const doc = document.documentElement;
                doc.style.setProperty('--app-height', `${this.height}px`);
                doc.style.setProperty('--fixed-height', `${this.height}px`);
                // message(`${this.height}px`);
            }
        }, 200);

        if (viewport) {
            resizeHandler.call(viewport);
            viewport.addEventListener('resize', resizeHandler);
            window.addEventListener('resize', callback);
        }

        return () => {
            viewport?.removeEventListener('resize', resizeHandler);
            window.removeEventListener('resize', callback);
            releaseHandler();
        };
    }, []);
};
