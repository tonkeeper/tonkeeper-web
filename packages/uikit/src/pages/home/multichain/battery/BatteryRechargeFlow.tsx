import { FC, useEffect, useMemo, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import { useMutation } from '@tanstack/react-query';

import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    isTon,
    legacyTonAssetId,
    TonAsset
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TransactionFee } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { UserCancelledError } from '@tonkeeper/core/dist/errors/UserCancelledError';
import { getErrorText } from '@tonkeeper/core/dist/errors/TranslatableError';

import { Button } from '../../../../primitives';
import { ConfirmActionResult } from '../../../../components/shared/ConfirmActionResult';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { cn } from '../../../../libs/css';
import { useAppContext } from '../../../../hooks/appContext';
import { useAppSdk } from '../../../../hooks/appSdk';
import { useAnalyticsTrack } from '../../../../hooks/analytics';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import {
    useEstimatePurchaseBattery,
    usePurchaseBatteryTransfer
} from '../../../../hooks/blockchain/usePurchaseBattery';
import { useTonRecipientValidator } from '../../../../components/fields/TonRecipientInput';
import { SendAddressField } from '../../../../components/transfer/multichain/SendAddressField';
import { NetworkFeeValue } from '../../../../components/transfer/multichain/NetworkFeeValue';
import { truncateAddress } from '../../../../components/transfer/multichain/multichainSendShared';
import Wallet16 from '../../../../icons/components/Wallet16';
import IcBatteryFlash44 from '../../../../icons/components/IcBatteryFlash44';
import { useAssetAmountFiatEquivalent } from '../../../../state/asset';
import {
    useBatteryMinBootstrapValue,
    BatteryPackName,
    useBatteryPacksReservedApplied,
    useBatteryShouldBeReservedAmount,
    useBatteryUnitTonRate,
    usePurchaseBatteryUnitTokenRate
} from '../../../../state/battery';
import { useAsset, useAssetWeiBalance } from '../../../../state/home';
import { useRate } from '../../../../state/rates';
import { useActiveAccount, useInvalidateActiveWalletQueries } from '../../../../state/wallet';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { SettingsListCell, SettingsListGroup } from '../settings/SettingsList';
import { BatteryLevelIcon } from './BatteryLevelIcon';
import type { BatteryOpenedFrom } from './BatteryModal';
import {
    formatAmount,
    formatCount,
    fromAmountInput,
    toAmountInput
} from '@tonkeeper/core/dist/utils/numberFormat';

type PackSize = BatteryPackName | 'custom';

const PACK_DISPLAY: Record<BatteryPackName, { level: 100 | 50 | 25; title: string }> = {
    large: { level: 100, title: 'battery_packages_title_large' },
    medium: { level: 50, title: 'battery_packages_title_medium' },
    small: { level: 25, title: 'battery_packages_title_small' }
};

interface RechargeSelection {
    amount: AssetAmount<TonAsset>;
    size: PackSize;
    giftRecipient?: string;
}

export interface BatteryRechargeFlowProps {
    isOpen: boolean;
    /** Dismisses the whole flow, battery screen included. */
    onClose: () => void;
    /** Returns to the battery screen. */
    onBack: () => void;
    assetId: string;
    asGift: boolean;
    from: BatteryOpenedFrom;
    /** The purchase was broadcast. */
    onDone: () => void;
}

/**
 * Recharge flow: pick a pack (or type an amount) in the chosen token, then
 * confirm the transfer to the relayer. A gift is the same purchase with the
 * recipient's address in the payload, so it only adds the address field.
 */
export const BatteryRechargeFlow: FC<BatteryRechargeFlowProps> = ({
    isOpen,
    onClose,
    onBack,
    assetId,
    asGift,
    from,
    onDone
}) => {
    const walletAsset = useAsset(assetId);
    // A wallet that never received USD₮ has no jetton row for it, yet the row is always offered.
    const asset = walletAsset ?? (assetId === TON_USDT_ASSET.id ? TON_USDT_ASSET : undefined);
    const [step, setStep] = useState<'select' | 'confirm'>('select');
    const [selection, setSelection] = useState<RechargeSelection | undefined>();

    if (!asset) {
        return null;
    }

    return (
        <>
            <BatteryRechargeSelectScreen
                isOpen={isOpen && step === 'select'}
                onClose={onClose}
                onBack={onBack}
                asset={asset}
                asGift={asGift}
                from={from}
                onContinue={picked => {
                    setSelection(picked);
                    setStep('confirm');
                }}
            />
            {selection && (
                <BatteryRechargeConfirmScreen
                    isOpen={isOpen && step === 'confirm'}
                    onClose={onClose}
                    onBack={() => setStep('select')}
                    selection={selection}
                    from={from}
                    onDone={onDone}
                />
            )}
        </>
    );
};

const AMOUNT_INPUT_PATTERN = /^\d*([.,]\d*)?$/;

const BatteryRechargeSelectScreen: FC<{
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    asset: TonAsset;
    asGift: boolean;
    from: BatteryOpenedFrom;
    onContinue: (selection: RechargeSelection) => void;
}> = ({ isOpen, onClose, onBack, asset, asGift, from, onContinue }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const track = useAnalyticsTrack();
    const packs = useBatteryPacksReservedApplied();
    const unitToTonRate = useBatteryUnitTonRate();
    const unitToTokenRate = usePurchaseBatteryUnitTokenRate(legacyTonAssetId(asset));
    const minValue = useBatteryMinBootstrapValue(asset);
    const reserve = useBatteryShouldBeReservedAmount();
    const { data: tokenRate } = useRate(legacyTonAssetId(asset));
    const weiBalance = useAssetWeiBalance(asset);
    const validateRecipient = useTonRecipientValidator();

    const [custom, setCustom] = useState(false);
    const [input, setInput] = useState('');
    const customInputRef = useRef<HTMLInputElement>(null);

    // The amount card mounts below the pack list, past the fold of the fixed-height
    // sheet — bring it into view and focus it once it exists.
    useEffect(() => {
        if (!custom) return;
        const element = customInputRef.current;
        if (!element) return;
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
        element.focus({ preventScroll: true });
    }, [custom]);
    const [recipientInput, setRecipientInput] = useState('');
    const [recipientTouched, setRecipientTouched] = useState(false);
    const [recipientInvalid, setRecipientInvalid] = useState(false);
    const [resolving, setResolving] = useState(false);

    const tokenPrice = useMemo(
        () => (tokenRate?.prices !== undefined ? new BigNumber(tokenRate.prices) : undefined),
        [tokenRate?.prices]
    );

    const packPriceInToken = (priceTon: AssetAmount) =>
        AssetAmount.fromRelativeAmount({
            asset,
            amount: priceTon.relativeAmount.div(unitToTonRate).multipliedBy(unitToTokenRate ?? 1)
        });

    const isAffordable = (price: AssetAmount<TonAsset>) =>
        !!weiBalance && price.weiAmount.lte(weiBalance) && (!minValue || price.isGT(minValue));

    const priceLabel = (price: AssetAmount<TonAsset>) =>
        tokenPrice
            ? formatFiatCurrency(fiat, price.relativeAmount.multipliedBy(tokenPrice))
            : price.stringAssetRelativeAmount;

    const customAmount = new BigNumber(input || '0');
    const customCharges =
        unitToTokenRate && reserve
            ? BigNumber.max(
                  customAmount.div(unitToTokenRate).minus(reserve.batteryUnits),
                  0
              ).integerValue(BigNumber.ROUND_DOWN)
            : new BigNumber(0);
    const customAssetAmount = AssetAmount.fromRelativeAmount({ asset, amount: customAmount });
    const remaining = weiBalance
        ? new AssetAmount({ asset, weiAmount: weiBalance.minus(customAssetAmount.weiAmount) })
        : undefined;

    let customError: string | undefined;
    if (customAmount.gt(0)) {
        if (remaining && remaining.weiAmount.lt(0)) {
            customError = t('battery_buy_error_not_enough_balance');
        } else if (minValue && customAmount.lt(minValue.relativeAmount)) {
            customError = t('battery_buy_error_min', {
                amount: minValue.stringAssetRelativeAmount
            });
        }
    }
    const customValid = customAmount.gt(0) && !customError;

    const recipientError =
        asGift && recipientTouched && (recipientInvalid || !recipientInput.trim())
            ? t('send_address_error')
            : undefined;

    const resolveRecipient = async (): Promise<string | undefined | null> => {
        if (!asGift) return undefined;
        setRecipientTouched(true);
        setResolving(true);
        try {
            const result = await validateRecipient(recipientInput);
            if (result && 'success' in result && result.success) {
                setRecipientInvalid(false);
                return result.result.address;
            }
            setRecipientInvalid(true);
            return null;
        } finally {
            setResolving(false);
        }
    };

    const submit = async (amount: AssetAmount<TonAsset>, size: PackSize) => {
        const giftRecipient = await resolveRecipient();
        if (giftRecipient === null) return;
        track({
            eventName: 'battery_select',
            from,
            type: 'crypto',
            size,
            jetton: isTon(asset.address) ? null : asset.symbol
        });
        onContinue({ amount, size, giftRecipient });
    };

    const onInputChange = (value: string) => {
        if (value !== '' && !AMOUNT_INPUT_PATTERN.test(value)) return;
        setInput(fromAmountInput(value));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            topBarTitle={
                asGift
                    ? t('battery_recharge_by_crypto_title_gift')
                    : t('battery_recharge_by_crypto_title')
            }
            variant="content"
            mobileHeight="full"
        >
            <div className="flex flex-col gap-4">
                {asGift && (
                    <SendAddressField
                        value={recipientInput}
                        onChange={value => {
                            setRecipientInput(value);
                            setRecipientInvalid(false);
                        }}
                        onClear={() => {
                            setRecipientInput('');
                            setRecipientInvalid(false);
                        }}
                        onPaste={async () => {
                            try {
                                const text = await navigator.clipboard.readText();
                                if (text) setRecipientInput(text.trim());
                            } catch {
                                /* clipboard unavailable / denied */
                            }
                        }}
                        onBlur={() => setRecipientTouched(true)}
                        error={recipientError}
                    />
                )}

                <SettingsListGroup>
                    {(packs ?? []).map(pack => {
                        const display = PACK_DISPLAY[pack.name];
                        const price = packPriceInToken(pack.price);
                        const charges = formatCount(pack.value.relativeAmount.div(unitToTonRate));
                        return (
                            <SettingsListCell
                                key={pack.id}
                                leftImage={<BatteryLevelIcon level={display.level} size={44} />}
                                title={t(display.title)}
                                subtitle={t('battery_charges', { charges })}
                                rightNode={
                                    <Button
                                        variant="primaryBlue"
                                        size="small"
                                        disabled={!unitToTokenRate || !isAffordable(price)}
                                        loading={resolving}
                                        onClick={() => submit(price, pack.name)}
                                    >
                                        {priceLabel(price)}
                                    </Button>
                                }
                            />
                        );
                    })}
                    <SettingsListCell
                        leftImage={<IcBatteryFlash44 className="h-11 w-[26px] text-iconTertiary" />}
                        title={t('battery_recharge_by_crypto_other_title')}
                        subtitle={t('battery_recharge_by_crypto_other_subtitle')}
                        chevron={!custom}
                        onClick={custom ? undefined : () => setCustom(true)}
                    />
                </SettingsListGroup>

                {custom && (
                    <>
                        <div className="flex h-[188px] flex-col items-center justify-center rounded-medium bg-backgroundContent px-4">
                            <div className="flex w-full items-baseline justify-center gap-1.5 overflow-hidden">
                                <input
                                    ref={customInputRef}
                                    value={toAmountInput(input)}
                                    onChange={e => onInputChange(e.target.value)}
                                    type="text"
                                    autoComplete="off"
                                    inputMode="decimal"
                                    placeholder="0"
                                    aria-label={t('battery_recharge_by_crypto_other_title')}
                                    size={1}
                                    className="[field-sizing:content] min-w-[1ch] max-w-full bg-transparent text-[40px] font-semibold leading-[48px] text-textPrimary outline-none placeholder:text-textPrimary"
                                />
                                <span className="shrink-0 text-[28px] font-semibold leading-9 text-textSecondary">
                                    {asset.symbol}
                                </span>
                            </div>
                            <div className="mt-2.5 rounded-full border-[1.5px] border-buttonTertiaryBackground px-4 py-2 text-body1 text-textSecondary">
                                ≈ {t('battery_charges', { charges: formatCount(customCharges) })}
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-4">
                            {customError ? (
                                <span className="min-w-0 flex-1 text-right text-body2 text-accentRed">
                                    {customError}
                                </span>
                            ) : (
                                remaining &&
                                remaining.weiAmount.gt(0) && (
                                    <span className="flex-1 truncate text-right text-body2 text-textSecondary">
                                        {t('battery_buy_remaining', {
                                            value: remaining.stringAssetRelativeAmount
                                        })}
                                    </span>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>

            {custom && (
                <ModalFooterPortal>
                    <ModalFooter>
                        <Button
                            variant="primaryBlue"
                            size="large"
                            fullWidth
                            disabled={!customValid}
                            loading={resolving}
                            onClick={() => submit(customAssetAmount, 'custom')}
                        >
                            {t('continue')}
                        </Button>
                    </ModalFooter>
                </ModalFooterPortal>
            )}
        </Modal>
    );
};

type TokenFee = Extract<TransactionFee, { type: 'ton-asset' | 'tron-asset' | 'ton-asset-relayed' }>;

const TokenFeeValue: FC<{ fee: TokenFee }> = ({ fee }) => {
    const { fiat } = useAppContext();
    const { data: fiatAmount } = useAssetAmountFiatEquivalent(fee.extra);
    return (
        <NetworkFeeValue
            value={
                fiatAmount
                    ? formatFiatCurrency(fiat, fiatAmount.abs())
                    : formatAmount(fee.extra.relativeAmount.abs(), { unit: fee.extra.stringAsset })
            }
            unit={fiatAmount ? fee.extra.asset.symbol : undefined}
        />
    );
};

const FeeValue: FC<{ fee: TransactionFee }> = ({ fee }) => {
    const { t } = useTranslation();
    if (fee.type === 'battery') {
        return <>{t('battery_n_battery_charges', { charges: formatCount(fee.charges) })}</>;
    }
    if (fee.type === 'free-transfer') {
        return <>{t('free')}</>;
    }
    return <TokenFeeValue fee={fee} />;
};

const BatteryRechargeConfirmScreen: FC<{
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    selection: RechargeSelection;
    from: BatteryOpenedFrom;
    onDone: () => void;
}> = ({ isOpen, onClose, onBack, selection, from, onDone }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const track = useAnalyticsTrack();
    const purchase = usePurchaseBatteryTransfer();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    const { amount, giftRecipient, size } = selection;
    const estimation = useEstimatePurchaseBattery({ assetAmount: amount, giftRecipient });
    const { data: amountFiat } = useAssetAmountFiatEquivalent(amount);

    const [sendError, setSendError] = useState<string | undefined>();
    const send = useMutation(async () => {
        await purchase({ estimation: estimation.data!, assetAmount: amount, giftRecipient });
        await invalidateAccountQueries();
    });

    useEffect(() => {
        if (!send.isSuccess) return undefined;
        const handle = window.setTimeout(onDone, 1200);
        return () => window.clearTimeout(handle);
    }, [send.isSuccess, onDone]);

    const onConfirm = async () => {
        setSendError(undefined);
        try {
            await send.mutateAsync();
            track({
                eventName: 'battery_success',
                from,
                type: 'crypto',
                size,
                jetton: isTon(amount.asset.address) ? null : amount.asset.symbol
            });
            sdk.hapticNotification('success');
        } catch (e) {
            sdk.hapticNotification('error');
            setSendError(
                e instanceof UserCancelledError
                    ? t('transaction_cancelled')
                    : getErrorText(e, { t })
            );
        }
    };

    const status = send.isLoading ? 'loading' : send.isSuccess ? 'done' : 'idle';
    const confirmDisabled = !estimation.data || estimation.isError;
    const backHandler = send.isLoading || send.isSuccess ? undefined : onBack;

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
                {t('confirm')}
            </Button>
        );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={backHandler}
            topBarTitle={t('confirm')}
            variant="content"
            mobileHeight="full"
        >
            <div className="flex min-h-full flex-col">
                <div className="flex flex-col items-center pb-8 pt-2">
                    <div className="pb-4">
                        <BatteryLevelIcon level={100} size={128} />
                    </div>
                    <p className="text-body1 text-textSecondary">
                        {giftRecipient
                            ? t('battery_recharge_by_crypto_title_gift')
                            : t('battery_recharge_by_crypto_title')}
                    </p>
                    <p className="text-h3 text-textPrimary">{amount.stringAssetRelativeAmount}</p>
                </div>

                <div className="overflow-hidden rounded-medium bg-backgroundContent">
                    <MultichainDetailCell
                        label={t('send_confirm_wallet')}
                        value={
                            <span className="inline-flex items-center justify-end gap-1.5">
                                <Wallet16 className="h-5 w-5" />
                                {account.name}
                            </span>
                        }
                    />
                    <MultichainDetailCell
                        label={t('send_confirm_recipient')}
                        value={giftRecipient ? truncateAddress(giftRecipient) : t('battery_title')}
                    />
                    <MultichainDetailCell
                        label={t('send_amount')}
                        value={amount.stringAssetRelativeAmount}
                        sub={amountFiat ? formatFiatCurrency(fiat, amountFiat) : undefined}
                    />
                    <MultichainDetailCell
                        label={t('send_network_fee')}
                        value={
                            estimation.data ? (
                                <FeeValue fee={estimation.data.fee} />
                            ) : (
                                <NetworkFeeValue
                                    loading={estimation.isLoading}
                                    error={estimation.isError}
                                    onRetry={() => estimation.refetch()}
                                />
                            )
                        }
                        last
                    />
                </div>

                {sendError && (
                    <p className={cn('pt-3 text-center text-body2 text-accentRed')}>{sendError}</p>
                )}
            </div>

            <ModalFooterPortal>
                <ModalFooter>{action}</ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
