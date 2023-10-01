import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { Viewport } from '@twa.js/sdk';
import { useMainButton, useViewport } from '@twa.js/sdk-react';
import React, { useEffect } from 'react';

export const ViewportContext = React.createContext<Viewport>(undefined!);

export const useTwaAppViewport = (setAppHeight: boolean) => {
    const sdk = useAppSdk();
    const viewport = useViewport();
    const mainButton = useMainButton();

    useEffect(() => {
        const total = window.innerHeight;
        const doc = document.documentElement;

        const visualViewport = window.visualViewport;

        const setWidth = (value: number) => {
            doc.style.setProperty('--app-width', `${value}px`);
        };

        const setHeight = (value: number) => {
            const fixed = mainButton.isVisible ? value + 60 : value;
            sdk.uiEvents.emit('keyboard', {
                method: 'keyboard',
                params: { total, viewport: fixed }
            });

            //  sdk.topMessage(`${value}px`);

            if (setAppHeight) {
                doc.style.setProperty('--app-height', `${value}px`);
            }
        };

        const callback = () => {
            if (visualViewport) {
                resizeHandler.call(visualViewport);
            }
        };

        const resizeHandler = function (this: VisualViewport) {
            setHeight(this.height);
        };

        setHeight(viewport.height);
        setWidth(viewport.width);

        viewport.on('heightChanged', setHeight);
        viewport.on('widthChanged', setWidth);

        if (visualViewport) {
            visualViewport.addEventListener('resize', resizeHandler);
            window.addEventListener('resize', callback);
        }

        return () => {
            viewport.off('heightChanged', setHeight);
            viewport.off('widthChanged', setWidth);

            visualViewport?.removeEventListener('resize', resizeHandler);
            window.removeEventListener('resize', callback);
        };
    }, [sdk, viewport]);
};
