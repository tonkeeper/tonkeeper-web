import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useQRScanner, useSDK } from '@twa.js/sdk-react';
import { useEffect } from 'react';

const Watcher = () => {
    const scanner = useQRScanner();

    const sdk = useAppSdk();

    useEffect(() => {
        const handler = async (options: { method: 'scan'; id?: number | undefined }) => {
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

export const TwaQrScanner = () => {
    const { didInit, components } = useSDK();

    if (didInit && components) {
        return <Watcher />;
    } else {
        return <></>;
    }
};
