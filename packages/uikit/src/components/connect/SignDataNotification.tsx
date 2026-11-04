import { SignDataRequestPayload, SignDataResponse } from '@tonkeeper/core/dist/entries/tonConnect';
import React, { FC, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { CheckmarkCircleIcon, ExclamationMarkCircleIcon } from '../Icon';
import {
    Notification,
    NotificationBlock,
    NotificationHeader,
    NotificationHeaderPortal,
    NotificationTitleRow
} from '../Notification';
import { Body2, H2, H3, Label1, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ResultButton } from '../transfer/common';
import { useActiveAccountQuery } from '../../state/wallet';
import { AccountAndWalletInfo } from '../account/AccountAndWalletInfo';
import { TxConfirmationCustomError } from '@tonkeeper/core/dist/errors/TxConfirmationCustomError';
import { useAppSdk } from '../../hooks/appSdk';
import { handleSubmit } from '../../libs/form';
import { ErrorIcon } from '../Icon';
import { Cell } from '@ton/core';
import { useAnalyticsTrack } from '../../hooks/analytics';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import {
    isSignDataPayloadValid,
    SigningWallet,
    useSignDataMutation,
    useSigningWallet
} from '../../state/tonConnectSignData';
import { TonConnectSignDataSheet } from '../../pages/home/multichain/connect/TonConnectSignDataSheet';
import { useTonConnectConfirmOperation } from '../../hooks/analytics/ton-connect';

const Payload = styled.div`
    background: ${props => props.theme.backgroundContent};
    border-radius: ${props =>
        props.theme.displayType === 'full-width'
            ? props.theme.corner2xSmall
            : props.theme.cornerMedium};
    padding: 16px;
    width: 100%;
    box-sizing: border-box;
`;

const SignText = styled.div`
    font-family: ${props => props.theme.fontMono};
    word-wrap: break-word;
`;

const ButtonRow = styled.div`
    padding-top: 12px;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
`;

const Disclaimer = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const WarningBlock = styled.div`
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    background-color: ${props => props.theme.accentOrange};
    position: relative;
    border-radius: ${props =>
        props.theme.displayType === 'full-width'
            ? props.theme.corner2xSmall
            : props.theme.cornerMedium};
    user-select: none;
`;

const WarningHeader = styled(Label1)`
    display: block;
    color: ${props => props.theme.textPrimaryAlternate};
`;

const WarningBody = styled(Body2)`
    display: block;
    color: ${props => props.theme.textPrimaryAlternate};
`;

const SignPayload: FC<{ params: SignDataRequestPayload }> = ({ params }) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    switch (params.type) {
        case 'text':
            return (
                <>
                    <Payload>
                        <SignText>{params.text}</SignText>
                        <ButtonRow>
                            <Button
                                size="small"
                                onClick={handleSubmit(() =>
                                    sdk.copyToClipboard(params.text, t('copied'))
                                )}
                            >
                                {t('receiveModal_copy')}
                            </Button>
                        </ButtonRow>
                    </Payload>
                    <Disclaimer>{t('signDataTextDisclaimer')}</Disclaimer>
                </>
            );
        case 'cell':
            const parsedCell = Cell.fromBase64(params.cell).toString();

            return (
                <>
                    <Disclaimer>{t('signDataCellDisclaimer')}</Disclaimer>
                    <Payload>
                        <SignText>{parsedCell}</SignText>

                        <ButtonRow>
                            <Button
                                size="small"
                                onClick={handleSubmit(() => sdk.copyToClipboard(params.cell))}
                            >
                                {t('receiveModal_copy')}
                            </Button>
                        </ButtonRow>
                    </Payload>
                </>
            );
        default:
            return (
                <>
                    <WarningBlock>
                        <WarningHeader>{t('signDataBinaryContent')}</WarningHeader>
                        <WarningBody>{t('signDataBinaryContentDisclaimer')}</WarningBody>
                    </WarningBlock>
                </>
            );
    }
};

const ErrorStyled = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    margin: 1rem 0 2rem;
`;

const Header = styled(H2)`
    text-align: center;
`;

const SignContent: FC<{
    origin: string;
    params: SignDataRequestPayload;
    signer: SigningWallet | undefined;
    handleClose: (result?: SignDataResponse) => void;
}> = ({ origin, params, signer, handleClose }) => {
    const { t } = useTranslation();

    const [done, setDone] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { mutateAsync, isLoading } = useSignDataMutation(origin, params, signer);
    const confirmOperation = useTonConnectConfirmOperation('signData');
    const onSubmit = async () => {
        confirmOperation.start();
        try {
            const result = await mutateAsync();
            confirmOperation.succeed();

            setDone(true);
            setTimeout(() => handleClose(result), 300);
        } catch (err) {
            confirmOperation.fail(err);
            setDone(true);
            setError(err as Error);
        }
    };

    const isValid = useMemo(() => isSignDataPayloadValid(params), [params]);

    if (!isValid || !signer) {
        return (
            <NotificationBlock onSubmit={handleSubmit(() => handleClose())}>
                <ErrorStyled>
                    <ErrorIcon />
                    <Header>{t('signDataError')}</Header>
                </ErrorStyled>
                <Button size="large" fullWidth primary type="submit">
                    {t('cancel')}
                </Button>
            </NotificationBlock>
        );
    }

    return (
        <NotificationBlock onSubmit={handleSubmit(onSubmit)}>
            <SignPayload params={params} />
            <>
                {done && !error && (
                    <ResultButton done>
                        <CheckmarkCircleIcon />
                        <Label2>{t('ton_login_success')}</Label2>
                    </ResultButton>
                )}
                {done && error && (
                    <ResultButton>
                        <ExclamationMarkCircleIcon />
                        <Label2>
                            {error instanceof TxConfirmationCustomError
                                ? error.message
                                : t('error_occurred')}
                        </Label2>
                    </ResultButton>
                )}
                {!done && (
                    <Button
                        size="large"
                        fullWidth
                        primary
                        loading={isLoading}
                        disabled={isLoading}
                        type="submit"
                    >
                        {t('signData')}
                    </Button>
                )}
            </>
        </NotificationBlock>
    );
};

const RowTitle = styled(H3)`
    overflow: hidden;
    margin: 0;
    user-select: none;
    flex: 1;
`;
const NameText = styled(Body2)`
    color: ${props => props.theme.textSecondary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const NotificationTitleRowStyled = styled(NotificationTitleRow)`
    align-items: flex-start;
`;

const Row = styled.div`
    display: flex;
    gap: 8px;
`;

const NotificationTitleWithWalletName: FC<{
    origin: string;
    signer: SigningWallet | undefined;
    onClose: () => void;
}> = ({ origin, signer, onClose }) => {
    const { t } = useTranslation();
    const title = useMemo(() => {
        try {
            return new URL(origin).host;
        } catch (e) {
            return 'UKNW';
        }
    }, [origin]);

    return (
        <NotificationHeaderPortal>
            <NotificationHeader>
                <NotificationTitleRowStyled handleClose={onClose}>
                    <RowTitle>{title}</RowTitle>
                    <Row>
                        <NameText>{t('signData')}</NameText>
                        {signer && (
                            <AccountAndWalletInfo
                                account={signer.account}
                                walletId={signer.wallet.id}
                            />
                        )}
                    </Row>
                </NotificationTitleRowStyled>
            </NotificationHeader>
        </NotificationHeaderPortal>
    );
};

export interface SignDataNotificationProps {
    origin: string | undefined;
    params: SignDataRequestPayload | null;
    walletId: WalletId | undefined;
    handleClose: (result?: SignDataResponse) => void;
}

/**
 * Signs with the wallet the request's connection belongs to (`walletId`),
 * whichever wallet is active.
 */
export const SignDataNotification: FC<SignDataNotificationProps> = props => {
    const { data: activeAccount } = useActiveAccountQuery();
    if (activeAccount?.type === 'multichain') {
        return <TonConnectSignDataSheet {...props} />;
    }
    return <LegacySignDataNotification {...props} />;
};

const LegacySignDataNotification: FC<SignDataNotificationProps> = ({
    origin,
    params,
    walletId,
    handleClose
}) => {
    const track = useAnalyticsTrack();
    const signer = useSigningWallet(walletId);

    const onClose = useCallback(
        (result?: SignDataResponse) => {
            handleClose(result);
            track({
                eventName: 'tc_sign_data_success',
                dapp_url: origin!,
                payload_type: params!.type
            });
        },
        [handleClose, track, origin, params]
    );

    const Content = useCallback(() => {
        if (!params || !origin) return undefined;
        return (
            <>
                <NotificationTitleWithWalletName
                    origin={origin}
                    signer={signer}
                    onClose={() => onClose()}
                />
                <SignContent
                    origin={origin}
                    params={params}
                    signer={signer}
                    handleClose={result => (params != null ? onClose(result) : undefined)}
                />
            </>
        );
    }, [origin, params, signer, onClose]);

    return (
        <>
            <Notification
                isOpen={params != null}
                handleClose={() => onClose()}
                title={undefined}
                hideButton
                onTopOfBrowser
            >
                {Content}
            </Notification>
        </>
    );
};
