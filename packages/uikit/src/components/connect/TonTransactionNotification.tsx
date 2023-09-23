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
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { getPasswordByNotification } from '../../pages/home/UnlockNotification';
import { CheckmarkCircleIcon } from '../Icon';
import { ListBlock } from '../List';
import { Notification, NotificationBlock } from '../Notification';
import { Label2 } from '../Text';
import { Button, ButtonRow } from '../fields/Button';
import { FeeListItem } from '../transfer/ConfirmListItem';
import { ResultButton } from '../transfer/common';
import { TonTransactionAction } from './TonTransactionAction';

const ButtonGap = styled.div`
    height: 56px;
`;

const ButtonRowFixed = styled(ButtonRow)`
    position: fixed;
    left: 0;
    right: 0;
    bottom: 16px;
    padding: 0 16px;
    box-sizing: border-box;

    &:after {
        content: '';
        position: absolute;
        width: 100%;
        left: 0;
        bottom: -1rem;
        height: calc(100% + 1rem);
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
        return sendTonConnectTransfer(sdk.storage, api.tonApi, wallet, accounts, params, password);
    });
};

const ConnectContent: FC<{
    params: TonConnectTransactionPayload;
    estimate?: EstimateData;
    handleClose: (result?: string) => void;
}> = ({ params, estimate, handleClose }) => {
    const sdk = useAppSdk();
    const [done, setDone] = useState(false);

    const { t } = useTranslation();

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

    const format = useFormatCoinValue();
    const feeAmount = useMemo(
        () => (estimate ? format(estimate.accountEvent.fee.total) : undefined),
        [format, estimate]
    );

    return (
        <NotificationBlock onSubmit={onSubmit}>
            {feeAmount && (
                <ListBlock margin={false} fullWidth>
                    <FeeListItem feeAmount={feeAmount} />
                </ListBlock>
            )}
            {(estimate?.accountEvent.actions ?? []).map((action, index) => (
                <TonTransactionAction key={index} action={action} />
            ))}
            <ButtonGap />
            <ButtonRowFixed>
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

const useEstimation = (params: TonConnectTransactionPayload | null) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { api } = useAppContext();
    const wallet = useWalletContext();

    return useQuery<EstimateData, Error>(
        [QueryKey.estimate, params],
        async () => {
            sdk.uiEvents.emit('copy', {
                method: 'copy',
                params: t('loading')
            });

            const accounts = await getAccountsMap(api.tonApi, params!);
            const accountEvent = await estimateTonConnectTransfer(
                api.tonApi,
                wallet,
                accounts,
                params!
            );
            return { accounts, accountEvent };
        },
        {
            enabled: params != null
        }
    );
};

export const TonTransactionNotification: FC<{
    params: TonConnectTransactionPayload | null;
    handleClose: (result?: string) => void;
}> = ({ params, handleClose }) => {
    const { t } = useTranslation();
    const { data: accountEvent, isLoading } = useEstimation(params);

    const Content = useCallback(() => {
        if (!params) return undefined;
        return <ConnectContent params={params} estimate={accountEvent} handleClose={handleClose} />;
    }, [origin, params, accountEvent, handleClose]);

    return (
        <Notification
            isOpen={!isLoading && params != null}
            handleClose={() => handleClose()}
            title={t('txActions_signRaw_title')}
            hideButton
        >
            {Content}
        </Notification>
    );
};
