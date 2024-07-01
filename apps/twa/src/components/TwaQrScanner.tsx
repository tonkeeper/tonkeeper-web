import { useQRScanner } from '@tma.js/sdk-react';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useEffect } from 'react';

export const TwaQrScanner = () => {
    const scanner = useQRScanner();

    const sdk = useAppSdk();

    useEffect(() => {
        const handler = async (options: { method: 'scan'; id?: number | undefined }) => {
            if (scanner.isOpened) {
                scanner.close();
            }
            const signature = await scanner.open();
            if (signature) {
                sdk.uiEvents.emit('response', {
                    method: 'response',
                    id: options.id,
                    params: signature
                });
            }
            scanner.close();
        };
        sdk.uiEvents.on('scan', handler);
        return () => {
            sdk.uiEvents.off('scan', handler);
        };
    }, []);

    return <></>;
};
