import { debounce } from '@tonkeeper/core/dist/utils/common';
import { Viewport } from '@twa.js/sdk';
import React, { useContext, useEffect } from 'react';

export const ViewportContext = React.createContext<Viewport>(undefined!);

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
