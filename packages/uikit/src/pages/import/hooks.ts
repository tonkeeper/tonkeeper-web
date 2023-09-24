import { useEffect } from 'react';
import { useAppSdk } from '../../hooks/appSdk';

export const useKeyboardHeight = () => {
    const sdk = useAppSdk();

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

        const resizeHandler = function (this: VisualViewport) {
            sdk.uiEvents.emit('keyboard', {
                method: 'keyboard',
                params: { total: innerHeight, viewport: this.height }
            });
        };

        if (viewport) {
            resizeHandler.call(viewport);
            viewport.addEventListener('resize', resizeHandler);
            window.addEventListener('resize', callback);
        }

        return () => {
            viewport?.removeEventListener('resize', resizeHandler);
            window.removeEventListener('resize', callback);
        };
    }, []);
};
