import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Cell } from '@ton/core';

import { SignDataRequestPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { getErrorText, TranslateFunction } from '@tonkeeper/core/dist/errors/TranslatableError';
import { isUserCancellation } from '@tonkeeper/core/dist/errors/UserCancelledError';
import { revealHiddenCharacters } from '@tonkeeper/core/dist/service/walletConnect/wcRequestSummary';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';

import type { SignDataNotificationProps } from '../../../../components/connect/SignDataNotification';
import { ConfirmActionResult } from '../../../../components/shared/ConfirmActionResult';
import { useAnalyticsTrack } from '../../../../hooks/analytics';
import { useTonConnectConfirmOperation } from '../../../../hooks/analytics/ton-connect';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useTranslation } from '../../../../hooks/translation';
import { Button, Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives';
import {
    SigningWallet,
    isSignDataPayloadValid,
    useSignDataMutation,
    useSigningWallet
} from '../../../../state/tonConnectSignData';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { networkLabel } from '../multichain-utils';
import {
    DappRequestAdvancedDetails,
    DappRequestAppCell,
    DappRequestCard,
    DappRequestHero,
    DappRequestNotice,
    DappRequestTextBlock,
    DappRequestWalletCell
} from './DappRequestDetails';

/** How long the "Done" result stays up before the dApp gets its answer and the sheet closes. */
const DONE_HOLD_MS = 300;

/**
 * "Confirm Action" sheet for a TonConnect `signData` request on a multichain
 * account. Signs with the wallet the request's connection belongs to
 * (`walletId`), whichever wallet is active.
 */
export const TonConnectSignDataSheet: FC<SignDataNotificationProps> = ({
    origin,
    params,
    walletId,
    handleClose
}) => {
    const track = useAnalyticsTrack();
    const signer = useSigningWallet(walletId);
    const isOpen = params !== null && origin !== undefined;
    const [busy, setBusy] = useState(false);

    const onClose = useCallback(
        (result?: Parameters<typeof handleClose>[0]) => {
            handleClose(result);
            track({
                eventName: 'tc_sign_data_success',
                dapp_url: origin!,
                payload_type: params!.type
            });
        },
        [handleClose, track, origin, params]
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                if (!busy) onClose();
            }}
            variant="content"
        >
            {isOpen && (
                <SignDataContent
                    origin={origin}
                    params={params}
                    signer={signer}
                    onClose={onClose}
                    onBusyChange={setBusy}
                />
            )}
        </Modal>
    );
};

const requestLabel = (params: SignDataRequestPayload, t: TranslateFunction): string => {
    switch (params.type) {
        case 'text':
            return t('connect_request_message');
        case 'cell':
            return t('connect_request_data');
        case 'binary':
            return t('signDataBinaryContent');
    }
};

const payloadText = (params: SignDataRequestPayload): string => {
    switch (params.type) {
        case 'text':
            return params.text;
        case 'cell':
            return Cell.fromBase64(params.cell).toString();
        case 'binary':
            return params.bytes;
    }
};

const SignDataContent: FC<{
    origin: string;
    params: SignDataRequestPayload;
    signer: SigningWallet | undefined;
    onClose: (result?: Parameters<SignDataNotificationProps['handleClose']>[0]) => void;
    onBusyChange: (busy: boolean) => void;
}> = ({ origin, params, signer, onClose, onBusyChange }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const sign = useSignDataMutation(origin, params, signer);

    const isValid = useMemo(() => isSignDataPayloadValid(params), [params]);
    const raw = useMemo(() => JSON.stringify(params, null, 2), [params]);

    useEffect(() => {
        onBusyChange(sign.isLoading || sign.isSuccess);
    }, [sign.isLoading, sign.isSuccess, onBusyChange]);
    useEffect(() => () => onBusyChange(false), [onBusyChange]);

    useEffect(() => {
        if (sign.error && !isUserCancellation(sign.error)) console.error(sign.error);
    }, [sign.error]);

    const confirmOperation = useTonConnectConfirmOperation('signData');

    const onConfirm = async () => {
        confirmOperation.start();
        try {
            const result = await sign.mutateAsync();
            confirmOperation.succeed();
            sdk.hapticNotification('success');
            setTimeout(() => onClose(result), DONE_HOLD_MS);
        } catch (e) {
            confirmOperation.fail(e);
            if (!isUserCancellation(e)) sdk.hapticNotification('error');
        }
    };

    const signError =
        sign.isError && !isUserCancellation(sign.error)
            ? getErrorText(sign.error, { t })
            : undefined;

    const action =
        !isValid || !signer ? (
            <Button variant="secondary" size="large" fullWidth onClick={() => onClose()}>
                {t('cancel')}
            </Button>
        ) : sign.isSuccess ? (
            <ConfirmActionResult variant="done" label={t('send_done')} />
        ) : (
            <Button
                variant="primaryBlue"
                size="large"
                fullWidth
                loading={sign.isLoading}
                disabled={sign.isLoading}
                onClick={onConfirm}
            >
                {t('confirm')}
            </Button>
        );

    return (
        <div className="flex min-h-full flex-col">
            <DappRequestHero network="ton" headline={t('connect_confirm_sign_message')} />

            <div className="flex flex-col gap-4">
                <DappRequestCard>
                    {signer && (
                        <DappRequestWalletCell
                            name={signer.account.name}
                            address={formatAddress(signer.wallet.rawAddress)}
                        />
                    )}
                    <DappRequestAppCell dappUrl={origin} />
                    <MultichainDetailCell
                        label={t('send_confirm_network')}
                        value={networkLabel('ton')}
                    />
                    <MultichainDetailCell
                        label={t('connect_request_request')}
                        value={requestLabel(params, t)}
                    />
                </DappRequestCard>

                {!isValid || !signer ? (
                    <DappRequestCard>
                        <DappRequestNotice tone="red">{t('signDataError')}</DappRequestNotice>
                    </DappRequestCard>
                ) : (
                    <SignDataPayloadCard params={params} />
                )}

                <DappRequestAdvancedDetails raw={raw} />
            </div>

            {signError && (
                <p className="px-1 pt-3 text-center text-body2 text-accentRed">{signError}</p>
            )}

            <ModalFooterPortal>
                <ModalFooter>{action}</ModalFooter>
            </ModalFooterPortal>
        </div>
    );
};

/**
 * What the dApp asks to sign, decoded for reading: the text with any hidden
 * characters made visible and flagged, a cell as its bit dump, raw bytes as
 * sent, each with its blind-signing notice. Expects a payload that passed
 * `isSignDataPayloadValid`.
 */
export const SignDataPayloadCard: FC<{ params: SignDataRequestPayload }> = ({ params }) => {
    const { t } = useTranslation();
    const text = useMemo(() => revealHiddenCharacters(payloadText(params)), [params]);

    return (
        <DappRequestCard>
            {params.type === 'binary' ? (
                <DappRequestNotice tone="orange">
                    {t('signDataBinaryContentDisclaimer')}
                </DappRequestNotice>
            ) : params.type === 'cell' ? (
                <DappRequestNotice tone="orange">{t('signDataCellDisclaimer')}</DappRequestNotice>
            ) : text.hasHidden ? (
                <DappRequestNotice tone="red">
                    {t('connect_request_hidden_characters_warning')}
                </DappRequestNotice>
            ) : null}
            <DappRequestTextBlock
                label={requestLabel(params, t)}
                text={text.text}
                mono={params.type !== 'text'}
            />
        </DappRequestCard>
    );
};
