import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import {
    ConnectTransferError,
    EstimateData,
    estimateTonConnectTransfer,
    getAccountsMap,
    sendTonConnectTransfer,
    tonConnectTransferError
} from '@tonkeeper/core/dist/service/transfer/tonService';
import { FC, useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { getSigner } from '../../state/mnemonic';
import { CheckmarkCircleIcon, ErrorIcon } from '../Icon';
import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal
} from '../Notification';
import { SkeletonList } from '../Skeleton';
import { Body2, H2, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ResultButton } from '../transfer/common';
import { EmulationList } from './EstimationLayout';
import { TxConfirmationCustomError } from '../../libs/errors/TxConfirmationCustomError';

const ButtonGap = styled.div`
    ${props =>
        props.theme.displayType === 'full-width'
            ? css`
                  height: 1rem;
              `
            : css`
                  display: none;
              `}
`;

const ButtonRowStyled = styled.div`
    display: flex;
    gap: 1rem;
    width: 100%;

    & > * {
        flex: 1;
    }
`;

const useSendMutation = (params: TonConnectTransactionPayload, estimate?: EstimateData) => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const client = useQueryClient();
    const { t } = useTranslation();

    return useMutation<string, Error>(async () => {
        const accounts = estimate?.accounts;
        if (!accounts) {
            throw new Error('Missing accounts data');
        }
        const signer = await getSigner(sdk, wallet.publicKey);
        if (signer.type !== 'cell') {
            throw new TxConfirmationCustomError(t('ledger_operation_not_supported'));
        }
        const value = await sendTonConnectTransfer(api, wallet, accounts, params, signer);
        client.invalidateQueries({
            predicate: query => query.queryKey.includes(wallet.active.rawAddress)
        });
        return value;
    });
};

const NotificationSkeleton: FC<{ handleClose: (result?: string) => void }> = ({ handleClose }) => {
    const { t } = useTranslation();

    return (
        <NotificationBlock>
            <SkeletonList size={3} margin fullWidth />
            <ButtonGap />
            <NotificationFooterPortal>
                <NotificationFooter>
                    <ButtonRowStyled>
                        <Button size="large" type="button" onClick={() => handleClose()}>
                            {t('notifications_alert_cancel')}
                        </Button>
                        <Button size="large" type="submit" primary loading>
                            {t('confirm')}
                        </Button>
                    </ButtonRowStyled>
                </NotificationFooter>
            </NotificationFooterPortal>
        </NotificationBlock>
    );
};

const ErrorStyled = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    margin: 1rem 0px 2rem;
`;

const Header = styled(H2)`
    text-align: center;
`;
const Secondary = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const NotificationIssue: FC<{
    kind: 'not-enough-balance';
    handleClose: (result?: string) => void;
}> = ({ handleClose }) => {
    const { t } = useTranslation();

    return (
        <NotificationBlock>
            <ErrorStyled>
                <ErrorIcon />
                <Header>{t('send_screen_steps_amount_insufficient_balance')}</Header>
            </ErrorStyled>

            <ButtonGap />
            <NotificationFooterPortal>
                <NotificationFooter>
                    <ButtonRowStyled>
                        <Button size="large" type="button" onClick={() => handleClose()}>
                            {t('notifications_alert_cancel')}
                        </Button>
                    </ButtonRowStyled>
                </NotificationFooter>
            </NotificationFooterPortal>
        </NotificationBlock>
    );
};

const ConnectContent: FC<{
    params: TonConnectTransactionPayload;
    handleClose: (result?: string) => void;
}> = ({ params, handleClose }) => {
    const sdk = useAppSdk();
    const [done, setDone] = useState(false);

    const { t } = useTranslation();

    const { data: issues, isFetched } = useTransactionError(params);
    const { data: estimate, isLoading: isEstimating, isError } = useEstimation(params, isFetched);
    const { mutateAsync, isLoading } = useSendMutation(params, estimate);

    useEffect(() => {
        if (sdk.twaExpand) {
            sdk.twaExpand();
        }
        sdk.hapticNotification('success');
    }, []);

    const onSubmit = async () => {
        const result = await mutateAsync();
        setDone(true);
        sdk.hapticNotification('success');
        setTimeout(() => handleClose(result), 300);
    };

    if (issues?.kind !== undefined) {
        return <NotificationIssue kind={issues?.kind} handleClose={handleClose} />;
    }

    if (isEstimating) {
        return <NotificationSkeleton handleClose={handleClose} />;
    }

    return (
        <NotificationBlock>
            <EmulationList isError={isError} estimate={estimate} />
            <ButtonGap />
            <NotificationFooterPortal>
                <NotificationFooter>
                    {done && (
                        <ResultButton done>
                            <CheckmarkCircleIcon />
                            <Label2>{t('ton_login_success')}</Label2>
                        </ResultButton>
                    )}
                    {!done && (
                        <ButtonRowStyled>
                            <Button
                                size="large"
                                type="button"
                                loading={isLoading}
                                disabled={isLoading}
                                onClick={() => handleClose()}
                            >
                                {t('notifications_alert_cancel')}
                            </Button>
                            <Button
                                size="large"
                                type="button"
                                primary
                                loading={isLoading}
                                disabled={isLoading}
                                onClick={onSubmit}
                            >
                                {t('confirm')}
                            </Button>
                        </ButtonRowStyled>
                    )}
                </NotificationFooter>
            </NotificationFooterPortal>
        </NotificationBlock>
    );
};

const useEstimation = (params: TonConnectTransactionPayload, errorFetched: boolean) => {
    const { api } = useAppContext();
    const wallet = useWalletContext();

    return useQuery<EstimateData, Error>(
        [QueryKey.estimate, params],
        async () => {
            const accounts = await getAccountsMap(api, params);
            const accountEvent = await estimateTonConnectTransfer(api, wallet, accounts, params);
            return { accounts, accountEvent };
        },
        { enabled: errorFetched }
    );
};

const useTransactionError = (params: TonConnectTransactionPayload) => {
    const { api } = useAppContext();
    const wallet = useWalletContext();

    return useQuery<ConnectTransferError, Error>([QueryKey.estimate, 'error', params], async () => {
        return tonConnectTransferError(api, wallet, params);
    });
};

export const TonTransactionNotification: FC<{
    params: TonConnectTransactionPayload | null;
    handleClose: (result?: string) => void;
}> = ({ params, handleClose }) => {
    const { t } = useTranslation();

    const Content = useCallback(() => {
        if (!params) return undefined;
        return <ConnectContent params={params} handleClose={handleClose} />;
    }, [origin, params, handleClose]);

    return (
        <Notification
            isOpen={params != null}
            handleClose={() => handleClose()}
            title={t('txActions_signRaw_title')}
            hideButton
        >
            {Content}
        </Notification>
    );
};
