import { FC, useEffect } from 'react';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { WalletConnectRequestPayload } from '@tonkeeper/core/dist/service/walletConnect/wcRequestTypes';
import { summarizeEvmTransaction } from '@tonkeeper/core/dist/service/walletConnect/wcRequestSummary';
import {
    nativeCoinAssetId,
    normalizeAnalyticsAssetId
} from '@tonkeeper/core/dist/analytics/asset-id';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { isUserCancellation } from '@tonkeeper/core/dist/errors/UserCancelledError';

import {
    toAnalyticsAmount,
    useTrackTransactionSent
} from '../../../../hooks/analytics/events-hooks';
import { useTranslation } from '../../../../hooks/translation';
import { Button, Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives';
import { ConfirmActionResult } from '../../../../components/shared/ConfirmActionResult';
import {
    useExecuteWalletConnectRequest,
    useRejectWalletConnectRequest
} from '../../../../state/walletConnectRequest';
import { DappRequestDetails, useDappRequestAssets } from './DappRequestDetails';

/**
 * "Confirm Action" sheet for a dApp-initiated WalletConnect request.
 * Confirming triggers the unlock flow, signs (and broadcasts where
 * applicable), and relays the JSON-RPC result back over the relay.
 */
export const WalletConnectConfirmSheet: FC<{
    request: WalletConnectRequestPayload | undefined;
    account: AccountMultichain | undefined;
    dappName?: string;
    dappUrl?: string;
}> = ({ request, account, dappName, dappUrl }) => {
    const { t } = useTranslation();
    const { nativeAsset, coin } = useDappRequestAssets(request?.network ?? 'eth');

    const execute = useExecuteWalletConnectRequest();
    const { mutate: reject } = useRejectWalletConnectRequest();
    const trackTransactionSent = useTrackTransactionSent();
    useEffect(() => {
        execute.reset();
        // Reset per incoming request only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [request?.id, request?.topic]);

    // The raw signer / node message stays in the console; the sheet shows a
    // localized notice instead, and none at all for a dismissed unlock prompt.
    useEffect(() => {
        if (execute.error) console.error(execute.error);
    }, [execute.error]);
    const showError = execute.isError && !isUserCancellation(execute.error);

    const onConfirm = () => {
        if (!request || !account) return;
        execute.mutate(
            { request, account },
            {
                onSuccess: () => {
                    // Signing requests answer the dapp without touching the
                    // chain; only eth_sendTransaction broadcasts.
                    if (request.kind !== 'eth_sendTransaction') return;
                    const summary = summarizeEvmTransaction(request.transaction);
                    const isPlainTransfer = summary.kind === 'transfer';
                    trackTransactionSent({
                        category: isPlainTransfer ? 'transfer' : 'call',
                        category_detail: isPlainTransfer ? 'coin' : 'unknown',
                        // The wallet's own asset id for the chain when it's
                        // loaded; the canonical form for the chain's coin otherwise.
                        asset: nativeAsset?.assetId
                            ? normalizeAnalyticsAssetId(nativeAsset.assetId)
                            : nativeCoinAssetId(request.network, Network.MAINNET),
                        amount: summary.value ? toAnalyticsAmount(summary.value, coin.decimals) : 0,
                        fee_asset: 'coin',
                        initiated_by: 'walletconnect',
                        ...(dappUrl && { dapp_url: dappUrl })
                    });
                }
            }
        );
    };
    const onClose = () => {
        if (request && !execute.isLoading) reject(request);
    };

    const status = execute.isLoading ? 'loading' : execute.isSuccess ? 'done' : 'idle';
    const action =
        status === 'done' ? (
            <ConfirmActionResult variant="done" label={t('send_done')} />
        ) : (
            <Button
                variant="primaryBlue"
                size="large"
                fullWidth
                loading={execute.isLoading}
                disabled={!account || execute.isLoading}
                onClick={onConfirm}
            >
                {t('confirm')}
            </Button>
        );

    return (
        <Modal isOpen={request !== undefined} onClose={onClose} variant="content">
            {request && (
                <div className="flex min-h-full flex-col">
                    <DappRequestDetails
                        request={request}
                        account={account}
                        dappName={dappName}
                        dappUrl={dappUrl}
                    />

                    {showError && (
                        <p className="px-1 pt-3 text-center text-body2 text-accentRed">
                            {t('error_action_failed')}
                        </p>
                    )}

                    <ModalFooterPortal>
                        <ModalFooter>{action}</ModalFooter>
                    </ModalFooterPortal>
                </div>
            )}
        </Modal>
    );
};
