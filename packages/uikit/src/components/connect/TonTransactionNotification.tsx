import { useMutation, useQuery } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import {
    EstimateData,
    estimateTonConnectTransfer,
    getAccountsMap,
    sendTonConnectTransfer
} from '@tonkeeper/core/dist/service/transfer/tonService';
import React, { FC, useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { getPasswordByNotification } from '../../pages/home/UnlockNotification';
import { CheckmarkCircleIcon } from '../Icon';
import { Notification, NotificationBlock } from '../Notification';
import { SkeletonList } from '../Skeleton';
import { Label2 } from '../Text';
import { Button, ButtonRow } from '../fields/Button';
import { ResultButton } from '../transfer/common';
import { EmulationList } from './EstimationLayout';

const ButtonGap = styled.div`
    height: 56px;
`;

const ButtonRowFixed = styled(ButtonRow)<{ standalone: boolean }>`
    position: fixed;

    ${props =>
        props.standalone
            ? css`
                  bottom: 32px;
              `
            : css`
                  bottom: 16px;
              `}

    padding: 0 16px;
    box-sizing: border-box;
    width: var(--app-width);

    &:after {
        content: '';
        position: absolute;
        width: 100%;
        top: 0;
        left: 0;
        bottom: -32px;
        height: calc(100% + 2rem);
        z-index: -1;
        background: ${props => props.theme.gradientBackgroundBottom};
    }
`;

const useSendMutation = (params: TonConnectTransactionPayload, estimate?: EstimateData) => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const { api } = useAppContext();

    return useMutation<string, Error>(async () => {
        const auth = await sdk.storage.get<AuthState>(AppKey.PASSWORD);
        if (!auth) {
            throw new Error('Missing Auth');
        }
        const accounts = estimate?.accounts;
        if (!accounts) {
            throw new Error('Missing accounts data');
        }
        const password = await getPasswordByNotification(sdk, auth);
        return sendTonConnectTransfer(sdk.storage, api, wallet, accounts, params, password);
    });
};

const NotificationSkeleton: FC<{ handleClose: (result?: string) => void }> = ({ handleClose }) => {
    const { standalone } = useAppContext();
    const { t } = useTranslation();

    return (
        <NotificationBlock>
            <SkeletonList size={3} margin fullWidth />
            <ButtonGap />
            <ButtonRowFixed standalone={standalone}>
                <Button size="large" type="button" onClick={() => handleClose()}>
                    {t('notifications_alert_cancel')}
                </Button>
                <Button size="large" type="submit" primary fullWidth loading>
                    {t('confirm')}
                </Button>
            </ButtonRowFixed>
        </NotificationBlock>
    );
};

const ConnectContent: FC<{
    params: TonConnectTransactionPayload;
    handleClose: (result?: string) => void;
}> = ({ params, handleClose }) => {
    const sdk = useAppSdk();
    const { standalone } = useAppContext();
    const [done, setDone] = useState(false);

    const { t } = useTranslation();

    const { data: estimate, isLoading: isEstimating, isError } = useEstimation(params);
    const { mutateAsync, isLoading } = useSendMutation(params, estimate);

    useEffect(() => {
        if (sdk.twaExpand) {
            sdk.twaExpand();
        }
    }, []);

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        const result = await mutateAsync();
        setDone(true);
        setTimeout(() => handleClose(result), 300);
    };

    if (isEstimating) {
        return <NotificationSkeleton handleClose={handleClose} />;
    }

    return (
        <NotificationBlock onSubmit={onSubmit}>
            <EmulationList isError={isError} estimate={estimate} />
            <ButtonGap />
            <ButtonRowFixed standalone={standalone}>
                {done && (
                    <ResultButton done>
                        <CheckmarkCircleIcon />
                        <Label2>{t('ton_login_success')}</Label2>
                    </ResultButton>
                )}
                {!done && (
                    <>
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
                            type="submit"
                            primary
                            fullWidth
                            loading={isLoading}
                            disabled={isLoading}
                        >
                            {t('confirm')}
                        </Button>
                    </>
                )}
            </ButtonRowFixed>
        </NotificationBlock>
    );
};

const useEstimation = (params: TonConnectTransactionPayload) => {
    const { api } = useAppContext();
    const wallet = useWalletContext();

    return useQuery<EstimateData, Error>([QueryKey.estimate, params], async () => {
        const accounts = await getAccountsMap(api, params);
        const accountEvent = await estimateTonConnectTransfer(api, wallet, accounts, params);
        return { accounts, accountEvent };
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
