import { debounce } from '@tonkeeper/core/dist/utils/common';
import { useEffect } from 'react';
import { useAppSdk } from '../../hooks/appSdk';

export const useKeyboardHeight = () => {
    const sdk = useAppSdk();

    useEffect(() => {
        const message = (value: string) =>
            sdk.uiEvents.emit('copy', { method: 'copy', params: value });

        const innerHeight = window.innerHeight;
        const viewport = window.visualViewport;

        function callback() {
            message('callback');
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
