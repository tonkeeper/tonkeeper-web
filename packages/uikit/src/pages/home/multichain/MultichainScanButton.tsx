import { FC, Suspense, useEffect, useState } from 'react';

import { TonConnectHttpConnectionParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';

import { useCompleteHttpConnection } from '../../../components/connect/connectHook';
import { useAppContext } from '../../../hooks/appContext';
import { useAppSdk } from '../../../hooks/appSdk';
import { useDeeplinkHandlers } from '../../../hooks/deeplinks/useDeeplinkHandlers';
import { useTranslation } from '../../../hooks/translation';
import IcQrViewfinderOutline28 from '../../../icons/components/IcQrViewfinderOutline28';
import { HomeHeaderIconButton } from './HomeHeaderIconButton';
import { MultichainConnectFlow, TonConnectCompleteResult } from './connect/MultichainConnectFlow';

const ScanIconButton: FC<{ onClick?: () => void }> = ({ onClick }) => {
    const { t } = useTranslation();
    return (
        <HomeHeaderIconButton
            label={t('scan_qr_title')}
            icon={<IcQrViewfinderOutline28 />}
            onClick={onClick}
            className="absolute left-2 top-1/2 -translate-y-1/2"
        />
    );
};

const WiredScanIconButton: FC = () => {
    const sdk = useAppSdk();
    const [scanId, setScanId] = useState<number | undefined>();
    const [connectParams, setConnectParams] = useState<TonConnectHttpConnectionParams | null>(null);

    const { mutateAsync: processLink, reset } = useDeeplinkHandlers({ origin: 'qr_code' });
    const { mutateAsync: completeConnection, reset: resetConnection } = useCompleteHttpConnection();

    // The scanner sheet answers on the shared `response` channel, so the id
    // this button generated is what tells its own scan apart from the send
    // form's address scan.
    useEffect(() => {
        const handler = (options: {
            method: 'response';
            id?: number | undefined;
            params: string;
        }) => {
            if (options.id !== scanId) return;
            // `useProcessOpenedLink` toasts an unreadable link itself.
            processLink(options.params).then(setConnectParams, () => {});
        };
        sdk.uiEvents.on('response', handler);
        return () => {
            sdk.uiEvents.off('response', handler);
        };
    }, [sdk.uiEvents, scanId, processLink]);

    const openScanner = () => {
        const id = Date.now();
        reset();
        setScanId(id);
        sdk.uiEvents.emit('scan', { method: 'scan', id, params: undefined });
    };

    const answerConnection = async (result: TonConnectCompleteResult) => {
        if (!connectParams) return;
        resetConnection();
        try {
            await completeConnection({ params: connectParams, result });
        } finally {
            setConnectParams(null);
        }
    };

    return (
        <>
            <ScanIconButton onClick={openScanner} />
            <MultichainConnectFlow
                request={connectParams ? { protocol: 'tonConnect', params: connectParams } : null}
                onClose={() => answerConnection(null)}
                onTonConnectComplete={answerConnection}
            />
        </>
    );
};

/**
 * The home header's QR entry point. A scanned code goes through the shared
 * deeplink handlers, so a transfer link ends up on the `transfer` uiEvent
 * (picked up by `MultichainBackgroundElements`), a swap/pool/browser link
 * navigates, and a TonConnect request opens the redesigned connect sheet
 * right here.
 *
 * Absent on the shells that have no camera to scan with (`hideQrScanner`),
 * matching the send form's address field. The wiring sits behind a
 * boundary because it reads the suspending battery-service config.
 */
export const MultichainScanButton: FC = () => {
    const { hideQrScanner } = useAppContext();
    if (hideQrScanner) return null;

    return (
        <Suspense fallback={<ScanIconButton />}>
            <WiredScanIconButton />
        </Suspense>
    );
};
