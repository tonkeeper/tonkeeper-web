import { useCallback, useEffect, useState } from 'react';
import { useAppSdk } from './appSdk';

export const useScanner = (initScan: number | null, onSubmit: (result: string) => void) => {
    const sdk = useAppSdk();
    const [scanId, setScanId] = useState<number | null>(initScan);

    useEffect(() => {
        if (scanId) {
            sdk.uiEvents.emit('scan', {
                method: 'scan',
                id: scanId,
                params: undefined
            });
        }
    }, [scanId]);

    useEffect(() => {
        const handler = (options: {
            method: 'response';
            id?: number | undefined;
            params: string;
        }) => {
            if (options.id === scanId) {
                onSubmit(options.params);
            }
        };
        sdk.uiEvents.on('response', handler);
        return () => {
            sdk.uiEvents.off('response', handler);
        };
    }, [sdk, scanId, onSubmit]);

    return useCallback(() => {
        setScanId(Date.now());
    }, [setScanId]);
};
