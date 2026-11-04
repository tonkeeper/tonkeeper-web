import { FC, useEffect, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';

import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { PoolImplementationType, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    TransactionFee,
    isTransactionFeeRefund
} from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { NotEnoughBalanceError } from '@tonkeeper/core/dist/errors/NotEnoughBalanceError';
import { UserCancelledError } from '@tonkeeper/core/dist/errors/UserCancelledError';
import { getErrorText } from '@tonkeeper/core/dist/errors/TranslatableError';
import {
    stakeTemporaryReserveTon,
    unstakeRequiredBalanceTon,
    unstakeTemporaryReserveTon
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/staking-encoder';

import { Button } from '../../../../primitives';
import { ConfirmActionResult } from '../../../../components/shared/ConfirmActionResult';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { useAppContext } from '../../../../hooks/appContext';
import { useAppSdk } from '../../../../hooks/appSdk';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../../libs/routes';
import {
    EXTERNAL_SENDER_CHOICE,
    SenderChoice,
    useTonConnectAvailableSendersChoices
} from '../../../../hooks/blockchain/useSender';
import {
    useTonConnectTransactionEstimation,
    useTonConnectTransactionSendMutation
} from '../../../../state/tonConnectTransaction';
import {
    toAnalyticsFeeAsset,
    useAnalyticsAssetId,
    useTrackTransactionSent
} from '../../../../hooks/analytics/events-hooks';
import { useStakingSendOperation } from '../../../../hooks/analytics/staking';
import { WalletEmoji } from '../../../../components/shared/emoji/WalletEmoji';
import { useAssetAmountFiatEquivalent } from '../../../../state/asset';
import { useActiveAccount, useTonBalance } from '../../../../state/wallet';
import { StakingPoolLogo, formatApy, formatCoinAmount } from './staking-shared';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { MultichainHint } from '../MultichainHint';
import { formatAmount, formatCount } from '@tonkeeper/core/dist/utils/numberFormat';

const FeeValue: FC<{ fee: TransactionFee }> = ({ fee }) => {
    const { t } = useTranslation();
    if (fee.type === 'battery') {
        return <>{t('battery_n_battery_charges', { charges: formatCount(fee.charges) })}</>;
    }
    if (fee.type === 'free-transfer') {
        return <>{t('free')}</>;
    }
    const amount = formatAmount(fee.extra.relativeAmount.abs(), { unit: fee.extra.stringAsset });
    return <>{isTransactionFeeRefund(fee) ? amount : `≈ ${amount}`}</>;
};

type TokenFee = Extract<TransactionFee, { type: 'ton-asset' | 'tron-asset' | 'ton-asset-relayed' }>;

const isTokenFee = (fee: TransactionFee): fee is TokenFee =>
    fee.type !== 'battery' && fee.type !== 'free-transfer';

const FeeFiatSub: FC<{ fee: TokenFee }> = ({ fee }) => {
    const { fiat } = useAppContext();
    const { data: fiatAmount } = useAssetAmountFiatEquivalent(fee.extra);
    if (!fiatAmount) return null;
    return <>≈ {formatFiatCurrency(fiat, fiatAmount.abs())}</>;
};

export interface StakingConfirmScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    pool: PoolInfo;
    /** Human-readable TON amount being staked / unstaked. */
    amount: BigNumber;
    variant: 'stake' | 'unstake';
    /**
     * Staking operation reported to analytics. Defaults to `variant` — claiming a
     * matured withdrawal reuses the unstake screen but is its own operation.
     */
    operation?: 'stake' | 'unstake' | 'claim';
    payload: TonConnectTransactionPayload;
}

/**
 * Confirm screen for stake/unstake transactions: pool hero, the wallet /
 * recipient / amount / APY / fee / temporary reserve table, and the confirm
 * button. Fee comes from the TonConnect estimation infra; the sender defaults
 * to the first available choice (battery when usable), matching the legacy
 * staking modal's default.
 */
export const StakingConfirmScreen: FC<StakingConfirmScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    pool,
    amount,
    variant,
    operation,
    payload
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const assetId = useAnalyticsAssetId();
    const trackTransactionSent = useTrackTransactionSent();
    const sendOperation = useStakingSendOperation(pool, operation ?? variant);
    const navigate = useNavigate();

    const { data: availableSendersChoices, isLoading: isChoicesLoading } =
        useTonConnectAvailableSendersChoices(payload);
    const senderChoice: SenderChoice = availableSendersChoices?.[0] ?? EXTERNAL_SENDER_CHOICE;

    const {
        data: estimate,
        isLoading: isEstimating,
        isError: isEstimationError,
        error: estimationError
    } = useTonConnectTransactionEstimation(payload, senderChoice, {
        paramsLoading: isChoicesLoading
    });

    const send = useTonConnectTransactionSendMutation(payload, estimate, {
        senderChoice,
        waitInvalidation: true
    });

    const backHandler = send.isLoading || send.isSuccess ? undefined : onBack;

    const assetAmount = useMemo(
        () => AssetAmount.fromRelativeAmount({ asset: TON_ASSET, amount }),
        [amount]
    );
    const { data: fiatBN } = useAssetAmountFiatEquivalent(assetAmount);
    const amountFiat = fiatBN ? formatFiatCurrency(fiat, fiatBN) : undefined;

    const temporaryReserve =
        variant === 'stake'
            ? stakeTemporaryReserveTon(pool.implementation)
            : operation === 'claim'
            ? 0
            : unstakeTemporaryReserveTon(pool.implementation);
    const reserveAssetAmount = useMemo(
        () => AssetAmount.fromRelativeAmount({ asset: TON_ASSET, amount: temporaryReserve }),
        [temporaryReserve]
    );
    const { data: reserveFiatBN } = useAssetAmountFiatEquivalent(reserveAssetAmount);
    const reserveFiat = reserveFiatBN ? formatFiatCurrency(fiat, reserveFiatBN) : undefined;
    const reserveHint =
        variant === 'stake'
            ? t('staking_temporary_reserve_hint', { value: formatCoinAmount(temporaryReserve) })
            : t('staking_temporary_reserve_unstake_hint', {
                  value: formatCoinAmount(temporaryReserve)
              });

    // The withdrawal message carries its own TON value, so a wallet holding
    // only the staked position can't pay for it; say so up front instead of
    // surfacing the emulation failure.
    const { data: tonBalance } = useTonBalance();
    const requiredBalance = unstakeRequiredBalanceTon(pool.implementation);
    const requiredBalanceError =
        variant === 'unstake' && tonBalance && tonBalance.relativeAmount.lt(requiredBalance)
            ? t('staking_unstake_required_balance', {
                  required: formatCoinAmount(requiredBalance),
                  balance: formatCoinAmount(tonBalance.relativeAmount)
              })
            : undefined;

    const [sendError, setSendError] = useState<string | undefined>();

    useEffect(() => {
        if (!send.isSuccess) return undefined;
        const handle = window.setTimeout(() => {
            onClose();
            navigate(MultichainRoute.history);
        }, 1800);
        return () => window.clearTimeout(handle);
    }, [send.isSuccess, onClose, navigate]);

    const onConfirm = async () => {
        setSendError(undefined);
        sendOperation.start(amount);
        try {
            await send.mutateAsync();
            sendOperation.succeed();
            trackTransactionSent({
                category: 'staking',
                category_detail: operation ?? variant,
                asset: assetId.tonCoin(),
                amount: amount.toNumber(),
                fee_asset: toAnalyticsFeeAsset(senderChoice.type),
                staking_provider: pool.address,
                is_liquid: pool.implementation === PoolImplementationType.LiquidTf
            });
            sdk.hapticNotification('success');
        } catch (e) {
            sendOperation.fail(e);
            sdk.hapticNotification('error');
            setSendError(
                e instanceof UserCancelledError || (e as Error)?.message === 'Cancel auth request'
                    ? t('transaction_cancelled')
                    : getErrorText(e, { t })
            );
        }
    };

    const insufficientBalance =
        estimationError instanceof NotEnoughBalanceError
            ? t('send_screen_steps_amount_insufficient_balance')
            : undefined;

    const status = send.isLoading ? 'loading' : send.isSuccess ? 'done' : 'idle';
    const confirmLabel =
        variant === 'stake' ? t('staking_confirm_and_stake') : t('staking_confirm_and_unstake');
    const confirmDisabled = isEstimating || isEstimationError || !!requiredBalanceError;

    const action =
        status === 'done' ? (
            <ConfirmActionResult variant="done" label={t('send_done')} />
        ) : (
            <Button
                variant="primaryBlue"
                size="large"
                fullWidth
                loading={send.isLoading}
                disabled={confirmDisabled}
                onClick={onConfirm}
            >
                {confirmLabel}
            </Button>
        );

    return (
        <Modal isOpen={isOpen} onClose={onClose} onBack={backHandler} variant="content">
            <div className="flex min-h-full flex-col">
                <div className="flex flex-col items-center pb-8 pt-2">
                    <div className="pb-5">
                        <StakingPoolLogo pool={pool} className="size-24" />
                    </div>
                    <p className="text-body1 text-textSecondary">{t('send_confirm_action')}</p>
                    <p className="text-h3 text-textPrimary">
                        {variant === 'stake'
                            ? t('staking_action_stake')
                            : t('staking_action_unstake')}
                    </p>
                </div>

                <div className="rounded-medium bg-backgroundContent">
                    <MultichainDetailCell
                        label={t('staking_confirm_modal_wallet')}
                        value={
                            <span className="inline-flex max-w-full items-center justify-end gap-1.5">
                                <WalletEmoji
                                    emoji={account.emoji}
                                    emojiSize="16px"
                                    containerSize="16px"
                                />
                                <span className="truncate">{account.name}</span>
                            </span>
                        }
                    />
                    <MultichainDetailCell label={t('send_confirm_recipient')} value={pool.name} />
                    <MultichainDetailCell
                        label={
                            variant === 'stake'
                                ? t('staking_confirm_modal_amount')
                                : t('staking_unstake_amount_label')
                        }
                        value={`${formatAmount(amount)} ${BRAND_CONFIG.coinSymbol}`}
                        sub={amountFiat}
                    />
                    {variant === 'stake' && (
                        <MultichainDetailCell
                            label={t('staking_confirm_modal_apy')}
                            value={formatApy(pool.apy)}
                        />
                    )}
                    <MultichainDetailCell
                        label={t('transaction_fee')}
                        value={
                            estimate?.fee ? (
                                <FeeValue fee={estimate.fee} />
                            ) : isEstimationError ? (
                                '—'
                            ) : (
                                '…'
                            )
                        }
                        sub={
                            estimate?.fee && isTokenFee(estimate.fee) ? (
                                <FeeFiatSub fee={estimate.fee} />
                            ) : undefined
                        }
                        last={temporaryReserve <= 0}
                    />
                    {temporaryReserve > 0 && (
                        <MultichainDetailCell
                            label={
                                <span className="inline-flex items-center gap-1">
                                    {t('staking_temporary_reserve')}
                                    <span className="inline-flex whitespace-normal">
                                        <MultichainHint
                                            label={t('staking_temporary_reserve')}
                                            text={reserveHint}
                                        />
                                    </span>
                                </span>
                            }
                            value={formatCoinAmount(temporaryReserve)}
                            sub={reserveFiat}
                            last
                        />
                    )}
                </div>

                {requiredBalanceError ? (
                    <div className="px-1 pt-3 text-center text-body2">
                        <p className="whitespace-pre-line text-accentRed">{requiredBalanceError}</p>
                        {temporaryReserve > 0 && (
                            <p className="pt-1 text-textSecondary">{reserveHint}</p>
                        )}
                    </div>
                ) : (
                    (sendError || insufficientBalance) && (
                        <p className="px-1 pt-3 text-center text-body2 text-accentRed">
                            {insufficientBalance ?? sendError}
                        </p>
                    )
                )}

                <ModalFooterPortal>
                    <ModalFooter>{action}</ModalFooter>
                </ModalFooterPortal>
            </div>
        </Modal>
    );
};
