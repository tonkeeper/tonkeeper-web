import UR from '@ngraveio/bc-ur/dist/ur';
import URDecoder from '@ngraveio/bc-ur/dist/urDecoder';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppSdk } from './appSdk';

export const useKeystoneScanner = (initScan: number | null, onSubmit: (result: UR) => void) => {
    const sdk = useAppSdk();
    const [scanId, setScanId] = useState<number | null>(initScan);
    const urDecoder = useMemo(() => new URDecoder(), []);

    const requestQrCode = useCallback(() => {
        if (scanId) {
            sdk.uiEvents.emit('scan', {
                method: 'scan',
                id: scanId,
                params: undefined
            });
        }
    }, [sdk, scanId]);

    useEffect(() => {
        requestQrCode();
    }, [requestQrCode]);

    useEffect(() => {
        const handler = (options: {
            method: 'response';
            id?: number | undefined;
            params: string;
        }) => {
            if (options.id === scanId) {
                // keystoneSdk.
                urDecoder.receivePart(options.params);
                if (urDecoder.isComplete()) {
                    onSubmit(urDecoder.resultUR());
                } else {
                    requestQrCode();
                }
            }
        };
        sdk.uiEvents.on('response', handler);
        return () => {
            sdk.uiEvents.off('response', handler);
        };
    }, [sdk, scanId, onSubmit, requestQrCode]);

    return useCallback(() => {
        setScanId(Date.now());
    }, [setScanId]);
};
