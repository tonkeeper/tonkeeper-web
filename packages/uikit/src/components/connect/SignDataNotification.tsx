import { useMutation } from '@tanstack/react-query';
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
import { Body2, H3, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ResultButton } from '../transfer/common';
import { useAccountsState, useActiveAccount, useActiveApi } from '../../state/wallet';
import { AccountAndWalletInfo } from '../account/AccountAndWalletInfo';
import { signDataResult, signDataUint8Array } from '@tonkeeper/core/dist/service/sign/signService';
import { TxConfirmationCustomError } from '../../libs/errors/TxConfirmationCustomError';
import { useAppSdk } from '../../hooks/appSdk';
import { getServerTime } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { signDataOver } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';

const useSignMutation = (origin: string, payload: SignDataRequestPayload) => {
    const activeAccount = useActiveAccount();
    const api = useActiveApi();
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    return useMutation<SignDataResponse, Error>(async () => {
        const domain = new URL(origin).host;
        if (!domain.includes('.')) {
            throw new TxConfirmationCustomError('Invalid domain');
        }

        const timestamp = await getServerTime(api);

        const payloadToSign = signDataUint8Array({
            payload,
            domain,
            address: activeAccount.activeTonWallet.rawAddress,
            timestamp
        });
        const singer = signDataOver({ sdk, accountId: activeAccount.id, t, checkTouchId });

        const signature = await singer(payloadToSign);

        return signDataResult({
            payload,
            domain,
            address: activeAccount.activeTonWallet.rawAddress,
            timestamp,
            signature
        });
    });
};

const Payload = styled.div`
    background: ${props => props.theme.backgroundContent};
    border-radius: ${props => props.theme.cornerMedium};
    padding: 16px 16px;
    width: 100%;
    box-sizing: border-box;
`;

const SignText = styled.div`
    font-family: ${props => props.theme.fontMono};
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
                                onClick={e => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    sdk.copyToClipboard(params.text);
                                }}
                            >
                                {t('receiveModal_copy')}
                            </Button>
                        </ButtonRow>
                    </Payload>
                    <Disclaimer>{t('signDataTextDisclaimer')}</Disclaimer>
                </>
            );
        default:
            return <></>;
    }
};
const SignContent: FC<{
    origin: string;
    params: SignDataRequestPayload;
    handleClose: (result?: SignDataResponse) => void;
}> = ({ origin, params, handleClose }) => {
    const { t } = useTranslation();

    const [done, setDone] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const { mutateAsync, isLoading } = useSignMutation(origin, params);
    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();

        try {
            const result = await mutateAsync();

            setDone(true);
            setTimeout(() => handleClose(result), 300);
        } catch (err) {
            setDone(true);
            setError(err as Error);
        }
    };

    return (
        <NotificationBlock onSubmit={onSubmit}>
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
                        {t('SignData')}
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

const NotificationTitleWithWalletName: FC<{ origin: string; onClose: () => void }> = ({
    origin,
    onClose
}) => {
    const wallets = useAccountsState();
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
                        <NameText>{t('SignData')}</NameText>
                        {wallets.length > 1 ? <AccountAndWalletInfo /> : undefined}
                    </Row>
                </NotificationTitleRowStyled>
            </NotificationHeader>
        </NotificationHeaderPortal>
    );
};

export const SignDataNotification: FC<{
    origin: string | undefined;
    params: SignDataRequestPayload | null;
    handleClose: (result?: SignDataResponse) => void;
}> = ({ origin, params, handleClose }) => {
    const onClose = useCallback(
        (result?: SignDataResponse) => {
            handleClose(result);
        },
        [handleClose]
    );

    const Content = useCallback(() => {
        if (!params || !origin) return undefined;
        return (
            <>
                <NotificationTitleWithWalletName origin={origin} onClose={() => onClose()} />
                <SignContent
                    origin={origin}
                    params={params}
                    handleClose={result => (params != null ? onClose(result) : undefined)}
                />
            </>
        );
    }, [origin, params, onClose]);

    return (
        <>
            <Notification
                isOpen={params != null}
                handleClose={() => onClose()}
                title={undefined}
                hideButton
            >
                {Content}
            </Notification>
        </>
    );
};
