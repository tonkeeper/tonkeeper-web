import UR from '@ngraveio/bc-ur/dist/ur';
import URDecoder from '@ngraveio/bc-ur/dist/urDecoder';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSdk } from './appSdk';
import { useTranslation } from './translation';

export const useKeystoneScanner = (initScan: number | null, onSubmit: (result: UR) => void) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const [scanId, setScanId] = useState<number | null>(initScan);
    /**
     * URDecoder is single-use: once it holds a result it ignores every further part and keeps
     * returning the old one. Every scan session therefore has to start with a fresh decoder,
     * otherwise a single mis-scanned QR code would make all subsequent attempts fail with the
     * stale result (e.g. "type not match" from the Keystone SDK).
     */
    const urDecoder = useRef<URDecoder | null>(null);

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
        urDecoder.current = new URDecoder();
        requestQrCode();
    }, [requestQrCode]);

    useEffect(() => {
        const handler = (options: {
            method: 'response';
            id?: number | undefined;
            params: string;
        }) => {
            if (options.id !== scanId) {
                return;
            }

            const decoder = urDecoder.current ?? new URDecoder();
            urDecoder.current = decoder;

            try {
                decoder.receivePart(options.params);
            } catch (e) {
                // Not a UR at all (an address, a link, ...): drop it and keep scanning.
                urDecoder.current = new URDecoder();
                sdk.topMessage(t('keystone_scan_not_keystone_qr'));
                requestQrCode();
                return;
            }

            if (decoder.isError()) {
                // Fountain decoding failed (parts of different QR sequences got mixed up):
                // start over instead of requesting parts forever.
                urDecoder.current = new URDecoder();
                requestQrCode();
                return;
            }

            if (!decoder.isComplete()) {
                requestQrCode();
                return;
            }

            const result = decoder.resultUR();
            // The session is over: never replay this result for a late duplicate frame.
            urDecoder.current = new URDecoder();
            setScanId(null);

            try {
                onSubmit(result);
            } catch (e) {
                // Never let the error escape into the event emitter: it would kill the scanner
                // loop and leave the scanner modal open with a dead camera stream.
                sdk.alert(e instanceof Error ? e.message : String(e));
            }
        };
        sdk.uiEvents.on('response', handler);
        return () => {
            sdk.uiEvents.off('response', handler);
        };
    }, [sdk, scanId, onSubmit, requestQrCode, t]);

    return useCallback(() => {
        setScanId(Date.now());
    }, [setScanId]);
};
