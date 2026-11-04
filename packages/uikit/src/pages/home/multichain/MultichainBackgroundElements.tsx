import { FC, useEffect, useState } from 'react';

import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';
import {
    MultichainTransferIntent,
    resolveMultichainTransferIntent
} from '@tonkeeper/core/dist/service/multichainTransferIntent';

import { MultichainSendFlow } from '../../../components/transfer/multichain/MultichainSendFlow';
import type { RampSource } from '../../../hooks/analytics/ramp-flow';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { useToast } from '../../../hooks/useNotification';
import { useMultichainWalletAssets } from '../../../state/multichain/useMultichainWalletAssets';

/**
 * App-wide listener for transfer intents on a multichain account: a
 * scanned QR code, a `ton://transfer/…` link opened as a URL, or a
 * deeplink handed over by the shell. Each resolves to an asset plus form
 * prefill and opens the multichain send flow.
 *
 * Every shell mounts this inside its multichain branch — it is the only
 * listener for the `transfer` uiEvent there, in place of the legacy
 * TON-only send notification.
 */
export const MultichainBackgroundElements: FC = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const toast = useToast();
    const { data, isError } = useMultichainWalletAssets();

    const [payload, setPayload] = useState<TransferInitParams | null>(null);
    const [intent, setIntent] = useState<MultichainTransferIntent | null>(null);
    const [from, setFrom] = useState<RampSource>('wallet_screen');

    useEffect(() => {
        const handler = (options: {
            method: 'transfer';
            id?: number | undefined;
            params: TransferInitParams;
        }) => {
            // Drop any session still on screen, so a second link doesn't
            // land on the first one's form.
            setIntent(null);
            setPayload(options.params);
        };
        sdk.uiEvents.on('transfer', handler);
        return () => {
            sdk.uiEvents.off('transfer', handler);
        };
    }, [sdk.uiEvents]);

    // Which token a payload names depends on the wallet's asset list, so a
    // link arriving before the portfolio has loaded waits for it. A failed
    // query resolves against an empty list rather than waiting forever —
    // the flow then opens on the picker with a toast, never nothing.
    const assetsSettled = data !== undefined || isError;

    useEffect(() => {
        if (!payload || !assetsSettled) return;
        const resolved = resolveMultichainTransferIntent(payload, data?.assets ?? []);
        setFrom(('origin' in payload && payload.origin) || 'wallet_screen');
        setPayload(null);
        setIntent(resolved);
        if (resolved.assetUnavailable) {
            toast(t('send_link_asset_not_found'));
        }
    }, [payload, assetsSettled, data, toast, t]);

    if (!intent) return null;

    return (
        <MultichainSendFlow
            isOpen
            onClose={() => setIntent(null)}
            initialAsset={intent.asset}
            initialForm={intent.form}
            allowedNetworks={intent.pickerNetworks}
            from={from}
        />
    );
};
