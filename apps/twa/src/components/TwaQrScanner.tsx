import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useEffect } from 'react';

export const TwaQrScanner = () => {
    const sdk = useAppSdk();

    useEffect(() => {
        const handler = async (options: { method: 'scan'; id?: number | undefined }) => {
            alert('Scanning is temporarily unavailable');
        };
        sdk.uiEvents.on('scan', handler);
        return () => {
            sdk.uiEvents.off('scan', handler);
        };
    }, []);

    return <></>;
};
