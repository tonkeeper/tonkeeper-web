import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    TON_CONNECT_MSG_VARIANTS_ID,
    TonConnectTransactionPayload,
    TonConnectTransactionPayloadVariantSelected
} from '@tonkeeper/core/dist/entries/tonConnect';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { anyOfKeysParts, QueryKey } from '../../libs/queryKey';
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
import { useIsActiveAccountMultisig } from '../../state/multisig';
import { MultisigOrderLifetimeMinutes } from '../../libs/multisig';
import { MultisigOrderFormView } from '../transfer/MultisigOrderFormView';
import { useTonConnectTransactionService } from '../../hooks/blockchain/useBlockchainService';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import BigNumber from 'bignumber.js';
import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    SenderChoiceUserAvailable,
    useGetEstimationSender,
    useGetSender,
    useTonConnectAvailableSendersChoices
} from '../../hooks/blockchain/useSender';
import { useToQueryKeyPart } from '../../hooks/useToQueryKeyPart';
import { Sender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { isTonEstimationDetailed, TonEstimationDetailed } from '@tonkeeper/core/dist/entries/send';
import { ActionFeeDetailsUniversal } from '../activity/NotificationCommon';

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
    params: TonConnectTransactionPayloadVariantSelected,
    estimate: TonEstimationDetailed,
    options: {
        multisigTTL?: MultisigOrderLifetimeMinutes;
        waitInvalidation?: boolean;
    }
) => {
    const account = useActiveAccount();
    const client = useQueryClient();
    const getSender = useGetSender();
    const tonConenctService = useTonConnectTransactionService();

    return useMutation<string, Error>(async () => {
        if (account.type === 'watch-only') {
            throw new Error('Cant use this account');
        }

        let sender: Sender;
        if (account.type === 'ton-multisig') {
            if (!options.multisigTTL) {
                throw new Error('TTL must be specified for multisig sending');
            }

            sender = await getSender({
                type: 'multisig',
                ttlSeconds: 60 * Number(options.multisigTTL)
            });
        } else {
            sender = await getSender(
                params.variant === 'battery' ? BATTERY_SENDER_CHOICE : EXTERNAL_SENDER_CHOICE
            );
        }

        const boc = await tonConenctService.send(sender, estimate, params);

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

const ActionFeeDetailsUniversalStyled = styled(ActionFeeDetailsUniversal)`
    background-color: transparent;
    width: 100%;
    margin-top: -24px;
`;

const ConnectContent: FC<{
    params: TonConnectTransactionPayload;
    handleClose: (result?: string) => void;
    waitInvalidation?: boolean;
    multisigTTL?: MultisigOrderLifetimeMinutes;
}> = ({ params, handleClose, waitInvalidation, multisigTTL }) => {
    const sdk = useAppSdk();

    const { t } = useTranslation();

    const { data: availableSendersChoices } = useTonConnectAvailableSendersChoices(params);
    const [selectedSenderType, onSenderTypeChange] = useState<SenderChoiceUserAvailable['type']>(
        EXTERNAL_SENDER_CHOICE.type
    );
    useEffect(() => {
        if (availableSendersChoices && availableSendersChoices[0]) {
            onSenderTypeChange(availableSendersChoices[0].type);
        }
    }, [availableSendersChoices]);

    const paramsVariantSelected: TonConnectTransactionPayloadVariantSelected = useMemo(() => {
        return {
            ...params,
            variant:
                selectedSenderType === 'external'
                    ? 'standard'
                    : selectedSenderType === 'battery'
                    ? TON_CONNECT_MSG_VARIANTS_ID.BATTERY
                    : TON_CONNECT_MSG_VARIANTS_ID.GASLESS
        };
    }, [params, selectedSenderType]);

    const { data: issues, isFetched } = useTransactionError(params);
    const {
        data: estimate,
        isLoading: isEstimating,
        isError
    } = useEstimation(paramsVariantSelected, isFetched);
    const {
        mutateAsync,
        isLoading,
        error: sendError,
        data: sendResult
    } = useSendMutation(paramsVariantSelected, estimate!, { multisigTTL, waitInvalidation });

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
            <EmulationList isError={isError} event={estimate?.event} hideExtraDetails />
            {!!estimate?.extra && (
                <ActionFeeDetailsUniversalStyled
                    availableSendersChoices={availableSendersChoices}
                    selectedSenderType={selectedSenderType}
                    onSenderTypeChange={onSenderTypeChange}
                    extra={estimate.extra}
                />
            )}
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

const useEstimation = (
    params: TonConnectTransactionPayloadVariantSelected,
    errorFetched: boolean
) => {
    const account = useActiveAccount();
    const accounts = useAccountsState();

    const getSender = useGetEstimationSender(
        params.variant === 'battery' ? BATTERY_SENDER_CHOICE : EXTERNAL_SENDER_CHOICE
    );
    const getSenderKey = useToQueryKeyPart(getSender);
    const tonConenctService = useTonConnectTransactionService();

    return useQuery<TonEstimationDetailed, Error>(
        [QueryKey.estimate, params, account, accounts, getSenderKey],
        async () => {
            if (account.type === 'watch-only') {
                throw new Error('Cant use this account');
            }

            const sender = await getSender!();

            const result = await tonConenctService.estimate(sender, params);

            if (!isTonEstimationDetailed(result)) {
                throw new Error("Can't get estimation details");
            }

            return result;
        },
        { enabled: errorFetched && !!getSender }
    );
};

type ConnectTransferError = { kind: 'not-enough-balance' } | { kind: undefined };

const useTransactionError = (params: TonConnectTransactionPayload) => {
    const { api } = useAppContext();
    const wallet = useActiveWallet();

    return useQuery<ConnectTransferError, Error>([QueryKey.estimate, 'error', params], async () => {
        const walletData = await new AccountsApi(api.tonApiV2).getAccount({
            accountId: wallet.rawAddress
        });

        const total = params.messages.reduce(
            (acc, message) => acc.plus(message.amount),
            new BigNumber(0)
        );

        if (total.isGreaterThanOrEqualTo(walletData.balance)) {
            return { kind: 'not-enough-balance' } as const;
        }

        return { kind: undefined };
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
