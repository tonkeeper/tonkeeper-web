import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import {
    ConnectTransferError,
    EstimateData,
    estimateMultisigTonConnectTransfer,
    estimateTonConnectTransfer,
    sendMultisigTonConnectTransfer,
    sendTonConnectTransfer,
    tonConnectTransferError
} from '@tonkeeper/core/dist/service/transfer/tonService';
import { FC, useCallback, useEffect, useState } from 'react';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { anyOfKeysParts, QueryKey } from '../../libs/queryKey';
import { getSigner } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';
import { CheckmarkCircleIcon, ErrorIcon, ExclamationMarkCircleIcon } from '../Icon';
import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal,
    NotificationHeader,
    NotificationHeaderPortal,
    NotificationTitleRow
} from '../Notification';
import { SkeletonListWithImages } from '../Skeleton';
import { H2, Label2, Label3 } from '../Text';
import { Button } from '../fields/Button';
import { MainButton, ResultButton, TransferViewHeaderBlock } from '../transfer/common';
import { EmulationList } from './EstimationLayout';
import { useAccountsState, useActiveAccount, useActiveWallet } from '../../state/wallet';
import { LedgerError } from '@tonkeeper/core/dist/errors/LedgerError';
import { AccountAndWalletInfo } from '../account/AccountAndWalletInfo';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { MultisigApi } from '@tonkeeper/core/dist/tonApiV2';
import { getMultisigSignerInfo, useIsActiveAccountMultisig } from '../../state/multisig';
import { MultisigOrderLifetimeMinutes } from '../../libs/multisig';
import { MultisigOrderFormView } from '../transfer/MultisigOrderFormView';

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

const useSendMutation = (
    params: TonConnectTransactionPayload,
    options: {
        multisigTTL?: MultisigOrderLifetimeMinutes;
        waitInvalidation?: boolean;
    }
) => {
    const account = useActiveAccount();
    const accounts = useAccountsState();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const client = useQueryClient();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    return useMutation<string, Error>(async () => {
        if (account.type === 'watch-only') {
            throw new Error('Cant use this account');
        }

        let boc: string;
        if (account.type === 'ton-multisig') {
            const multisig = await new MultisigApi(api.tonApiV2).getMultisigAccount({
                accountId: account.activeTonWallet.rawAddress
            });
            const { signerWallet, signerAccount } = getMultisigSignerInfo(accounts, account);
            const signer = await getSigner(sdk, signerAccount.id, checkTouchId);

            if (!options.multisigTTL) {
                throw new Error('TTL is required');
            }

            boc = await sendMultisigTonConnectTransfer({
                api,
                multisig,
                hostWallet: signerWallet,
                params,
                signer,
                ttlSeconds: 60 * Number(options.multisigTTL)
            });
        } else {
            const signer = await getSigner(sdk, account.id, checkTouchId);

            boc = await sendTonConnectTransfer(api, account, params, signer);
        }
        const invalidationPromise = client.invalidateQueries(
            anyOfKeysParts(account.id, account.activeTonWallet.id)
        );
        if (options.waitInvalidation) {
            await invalidationPromise;
        }
        return boc;
    });
};

const NotificationSkeleton: FC<{ handleClose: (result?: string) => void }> = ({ handleClose }) => {
    const { t } = useTranslation();

    return (
        <NotificationBlock>
            <SkeletonListWithImages size={3} margin fullWidth />
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

const ExclamationMarkCircleIconStyled = styled(ExclamationMarkCircleIcon)`
    min-width: 32px;
    min-height: 32px;
`;

const ResultButtonErrored = styled(ResultButton)`
    height: fit-content;
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
    waitInvalidation?: boolean;
    multisigTTL?: MultisigOrderLifetimeMinutes;
}> = ({ params, handleClose, waitInvalidation, multisigTTL }) => {
    const sdk = useAppSdk();

    const { t } = useTranslation();

    const { data: issues, isFetched } = useTransactionError(params);
    const { data: estimate, isLoading: isEstimating, isError } = useEstimation(params, isFetched);
    const {
        mutateAsync,
        isLoading,
        error: sendError,
        data: sendResult
    } = useSendMutation(params, { multisigTTL, waitInvalidation });

    useEffect(() => {
        if (sdk.twaExpand) {
            sdk.twaExpand();
        }
        sdk.hapticNotification('success');
    }, []);

    const onSubmit = async () => {
        try {
            const result = await mutateAsync();
            sdk.hapticNotification('success');
            setTimeout(() => handleClose(result), 300);
        } catch (e) {
            setTimeout(() => handleClose(), 3000);
            console.error(e);
        }
    };

    if (issues?.kind !== undefined) {
        return <NotificationIssue kind={issues?.kind} handleClose={handleClose} />;
    }

    if (isEstimating) {
        return <NotificationSkeleton handleClose={handleClose} />;
    }

    const done = sendResult !== undefined;
    const shouldUpdateLedger = sendError && sendError instanceof LedgerError;

    return (
        <NotificationBlock>
            <EmulationList isError={isError} estimate={estimate} />
            <ButtonGap />
            <NotificationFooterPortal>
                <NotificationFooter>
                    {sendError ? (
                        <ResultButtonErrored>
                            <ExclamationMarkCircleIconStyled />
                            <Label2>{t('error_occurred')}</Label2>
                            {shouldUpdateLedger && <Label3>{t('update_ledger_error')}</Label3>}
                        </ResultButtonErrored>
                    ) : done ? (
                        <ResultButton done>
                            <CheckmarkCircleIcon />
                            <Label2>{t('ton_login_success')}</Label2>
                        </ResultButton>
                    ) : (
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
    const account = useActiveAccount();
    const accounts = useAccountsState();

    return useQuery<EstimateData, Error>(
        [QueryKey.estimate, params, account, accounts],
        async () => {
            if (isAccountTonWalletStandard(account)) {
                const accountEvent = await estimateTonConnectTransfer(api, account, params);
                return { accountEvent };
            }

            if (account.type === 'ton-multisig') {
                const multisig = await new MultisigApi(api.tonApiV2).getMultisigAccount({
                    accountId: account.activeTonWallet.rawAddress
                });
                const { signerWallet } = getMultisigSignerInfo(accounts, account);
                const accountEvent = await estimateMultisigTonConnectTransfer(
                    api,
                    signerWallet,
                    multisig,
                    params
                );

                return { accountEvent };
            }

            throw new Error(`Ton Connect does not support this account type: ${account.type}`);
        },
        { enabled: errorFetched }
    );
};

const useTransactionError = (params: TonConnectTransactionPayload) => {
    const { api } = useAppContext();
    const wallet = useActiveWallet();

    return useQuery<ConnectTransferError, Error>([QueryKey.estimate, 'error', params], async () => {
        return tonConnectTransferError(api, wallet, params);
    });
};

const NotificationTitleRowStyled = styled(NotificationTitleRow)`
    align-items: flex-start;
`;

const NotificationTitleWithWalletName: FC<{ onClose: () => void }> = ({ onClose }) => {
    const { t } = useTranslation();

    return (
        <NotificationHeaderPortal>
            <NotificationHeader>
                <NotificationTitleRowStyled handleClose={onClose}>
                    <div>
                        {t('txActions_signRaw_title')}
                        <AccountAndWalletInfo />
                    </div>
                </NotificationTitleRowStyled>
            </NotificationHeader>
        </NotificationHeaderPortal>
    );
};

export const TonTransactionNotification: FC<{
    params: TonConnectTransactionPayload | null;
    handleClose: (result?: string) => void;
    waitInvalidation?: boolean;
}> = ({ params, handleClose, waitInvalidation }) => {
    const { t } = useTranslation();
    const wallets = useAccountsState();
    const isActiveAccountMultisig = useIsActiveAccountMultisig();
    const [multisigTTL, setMultisigTTL] = useState<MultisigOrderLifetimeMinutes | undefined>();

    const onClose = useCallback(
        (boc?: string) => {
            setTimeout(() => setMultisigTTL(undefined), 400);
            handleClose(boc);
        },
        [setMultisigTTL, handleClose]
    );

    const Content = useCallback(() => {
        if (!params) return undefined;

        if (isActiveAccountMultisig && !multisigTTL) {
            return (
                <MultisigOrderFormView
                    onSubmit={form => setMultisigTTL(form.lifetime)}
                    MainButton={MainButton}
                    Header={() => (
                        <TransferViewHeaderBlock
                            title={t('multisig_create_order_title')}
                            onClose={onClose}
                        />
                    )}
                    isAnimationProcess={false}
                />
            );
        }

        return (
            <>
                {wallets.length > 1 && (
                    <NotificationTitleWithWalletName onClose={() => onClose()} />
                )}
                <ConnectContent
                    params={params}
                    handleClose={boc => (params != null ? onClose(boc) : undefined)}
                    waitInvalidation={waitInvalidation}
                    multisigTTL={multisigTTL}
                />
            </>
        );
    }, [
        origin,
        params,
        onClose,
        wallets.length,
        isActiveAccountMultisig,
        multisigTTL,
        setMultisigTTL
    ]);

    return (
        <>
            <Notification
                isOpen={params != null}
                handleClose={() => onClose()}
                title={wallets.length > 1 ? undefined : t('txActions_signRaw_title')}
                hideButton
            >
                {Content}
            </Notification>
        </>
    );
};
