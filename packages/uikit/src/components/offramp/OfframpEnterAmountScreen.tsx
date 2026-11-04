import { ChangeEvent, FC, useEffect, useMemo, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import type {
    ExchangeMerchantSlug,
    ExchangePaymentMethodType,
    RampQuote
} from '@tonkeeper/core/dist/onrampApi';
import type { OfframpQuoteResult } from '@tonkeeper/core/dist/offrampApi';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import {
    formatAmount,
    fromAmountInput,
    toAmountInput
} from '@tonkeeper/core/dist/utils/numberFormat';
import { Button } from '../../primitives/Button';
import { Loader } from '../../primitives/Loader';
import { Modal, ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import { useExchangeMerchants } from '../../state/onramp';
import { useOfframpQuote } from '../../state/offramp';
import { useTranslation } from '../../hooks/translation';
import { cn } from '../../libs/css';
import { ChooseProviderModal } from '../onramp/ChooseProviderModal';
import { ProviderCard } from '../onramp/ProviderCard';

const DEBOUNCE_MS = 300;

export interface OfframpEnterAmountScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    /** The wallet asset being sold; its balance caps the input. */
    asset: MultichainWalletAsset;
    /** Fiat the user is paid out in (e.g. "USD"). */
    fiat: string;
    payoutMethod: ExchangePaymentMethodType;
    /**
     * Called with the selected quote when the user taps Continue. The parent
     * owns the disclaimer and the create-order call.
     */
    onContinue: (quote: OfframpQuoteResult) => void;
    /** Shows Continue busy while the caller places the order straight from this step. */
    isContinueLoading?: boolean;
    /**
     * Fires when a provider first appears on the card and again each time
     * the shown provider changes, for the "view insert amount" analytics.
     */
    onProviderViewed?: (quote: OfframpQuoteResult) => void;
}

const amountPattern = (decimals: number) =>
    new RegExp(`^\\d{0,18}(\\.\\d{0,${Math.max(decimals, 0)}})?$`);

const isValidAmount = (s: string, decimals: number) =>
    amountPattern(decimals).test(s) && s !== '' && s !== '.';

/**
 * Off-ramp amount step. The user types crypto and sees the fiat they will
 * receive, bounded by the wallet balance (MAX fills it) and by each
 * provider's crypto min/max from the quote response. Nothing is prefilled:
 * the first quote fires on the first keystroke.
 */
export const OfframpEnterAmountScreen: FC<OfframpEnterAmountScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    asset,
    fiat,
    payoutMethod,
    onContinue,
    isContinueLoading,
    onProviderViewed
}) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState<string>('');
    const [debouncedAmount, setDebouncedAmount] = useState<string>('');
    const [selectedMerchant, setSelectedMerchant] = useState<ExchangeMerchantSlug | undefined>();
    const [providerModalOpen, setProviderModalOpen] = useState(false);

    const quote = useOfframpQuote();
    const merchants = useExchangeMerchants();

    const merchantImageBySlug = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of merchants.data ?? []) {
            if (m.image) map.set(m.id, m.image);
        }
        return map;
    }, [merchants.data]);

    const balance = useMemo(
        () => new BigNumber(asset.balance).shiftedBy(-asset.decimals),
        [asset.balance, asset.decimals]
    );
    const validAmount = isValidAmount(amount, asset.decimals);
    const exceedsBalance = validAmount && new BigNumber(amount).gt(balance);

    const lastSentRef = useRef<string>('');

    useEffect(() => {
        const handle = window.setTimeout(() => setDebouncedAmount(amount), DEBOUNCE_MS);
        return () => window.clearTimeout(handle);
    }, [amount]);

    useEffect(() => {
        if (!debouncedAmount || !isValidAmount(debouncedAmount, asset.decimals)) return;
        if (new BigNumber(debouncedAmount).lte(0)) return;
        if (lastSentRef.current === debouncedAmount) return;
        lastSentRef.current = debouncedAmount;
        quote.mutate({
            sourceAssetId: asset.assetId,
            fiat,
            amount: debouncedAmount,
            payoutMethod
        });
    }, [debouncedAmount, asset.assetId, asset.decimals, fiat, payoutMethod, quote]);

    const items = useMemo(() => quote.data?.items ?? [], [quote.data?.items]);
    const suggested = useMemo(() => quote.data?.suggested ?? [], [quote.data?.suggested]);
    const best = items[0];

    // Stick to the user's chosen merchant while it still quotes; otherwise
    // the best one. Below every minimum `items` is empty, and `suggested[0]`
    // keeps the card on screen with the merchant's minimum in orange.
    const selected = useMemo<OfframpQuoteResult | undefined>(() => {
        if (selectedMerchant) {
            const fromItems = items.find(i => i.merchant === selectedMerchant);
            if (fromItems) return fromItems;
            const fromSuggested = suggested.find(s => s.merchant === selectedMerchant);
            if (fromSuggested) return fromSuggested;
        }
        return best ?? suggested[0];
    }, [items, suggested, selectedMerchant, best]);

    const selectedNeedsMin = !!selected && !items.some(i => i.merchant === selected.merchant);

    const viewedMerchantRef = useRef<string | undefined>();
    useEffect(() => {
        if (!selected || viewedMerchantRef.current === selected.merchant) return;
        viewedMerchantRef.current = selected.merchant;
        onProviderViewed?.(selected);
    }, [selected, onProviderViewed]);

    const otherSuggested = suggested.filter(s => !items.some(i => i.merchant === s.merchant));
    const hasMultipleProviders = items.length + otherSuggested.length > 1;

    const limitError = useMemo<string | undefined>(() => {
        if (!validAmount || best || quote.isLoading) return undefined;

        const fallback = suggested[0];
        if (fallback?.maxAmount) {
            const max = new BigNumber(fallback.maxAmount);
            if (max.gt(0) && new BigNumber(amount).gt(max)) {
                return t('enter_amount_max_error', {
                    amount: formatAmount(fallback.maxAmount),
                    fiat: asset.symbol
                });
            }
        }

        switch (quote.data?.unavailableReason) {
            case 'country_blocked':
                return t('enter_amount_unavailable_country');
            case 'no_merchant_supports_pair':
                return t('enter_amount_unavailable_pair');
            case 'amount_above_max':
                return t('enter_amount_unavailable_above_max');
            default:
                return undefined;
        }
    }, [validAmount, best, quote.isLoading, quote.data, suggested, amount, asset.symbol, t]);

    const canContinue =
        !!selected &&
        !selectedNeedsMin &&
        !quote.isLoading &&
        validAmount &&
        !exceedsBalance &&
        lastSentRef.current === amount;

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = fromAmountInput(e.target.value);
        if (value === '' || amountPattern(asset.decimals).test(value)) {
            setAmount(value);
        }
    };

    const onMax = () => {
        const value = balance.toFixed();
        setAmount(value);
        setDebouncedAmount(value);
    };

    const onPickProvider = (pickedQuote: RampQuote) => {
        setSelectedMerchant(pickedQuote.merchant);
        const isInItems = items.some(i => i.merchant === pickedQuote.merchant);
        if (!isInItems && pickedQuote.minAmount) {
            const min = new BigNumber(pickedQuote.minAmount);
            if (min.isFinite() && min.gt(0)) {
                const value = min.decimalPlaces(asset.decimals, BigNumber.ROUND_UP).toFixed();
                setAmount(value);
                setDebouncedAmount(value);
            }
        }
        setProviderModalOpen(false);
    };

    const fiatOut =
        selected && !selectedNeedsMin
            ? `≈ ${formatAmount(selected.amountOut, { unit: fiat })}`
            : undefined;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                onBack={onBack}
                variant="content"
                topBarTitle={t('enter_amount_title')}
                mobileHeight="half"
            >
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col items-center gap-3 rounded-medium bg-backgroundContent px-4 py-6">
                        <div className="flex w-full max-w-full items-baseline justify-center gap-2 overflow-hidden">
                            <input
                                value={toAmountInput(amount)}
                                onChange={onChange}
                                inputMode="decimal"
                                placeholder="0"
                                aria-label="amount"
                                size={1}
                                className="[field-sizing:content] min-w-[1ch] max-w-full bg-transparent text-4xl font-bold text-textPrimary outline-none placeholder:text-textTertiary"
                            />
                            <span className="shrink-0 text-3xl font-bold text-textTertiary">
                                {asset.symbol}
                            </span>
                        </div>
                        {/* Fixed height: the pill swaps between text and the loader and
                            must not move the input above it. A typed amount with no
                            quote (below every minimum, or a hard error) has no
                            equivalent to show, and a `0` there would read as a real
                            conversion. */}
                        <div
                            className={cn(
                                'flex h-6 max-w-full items-center rounded-full bg-backgroundContentTint px-3 text-body3 text-textSecondary',
                                quote.isLoading && fiatOut && 'opacity-60',
                                !fiatOut && !quote.isLoading && validAmount && 'invisible'
                            )}
                        >
                            {fiatOut ? (
                                <span className="truncate">{fiatOut}</span>
                            ) : quote.isLoading ? (
                                <Loader size="xSmall" />
                            ) : (
                                `0 ${fiat}`
                            )}
                        </div>
                        <div className="flex w-full items-center justify-between gap-2 text-body3">
                            <span
                                className={cn(
                                    'min-w-0 truncate',
                                    exceedsBalance ? 'text-accentRed' : 'text-textSecondary'
                                )}
                            >
                                {exceedsBalance
                                    ? t('confirm_error_insufficient_balance_light')
                                    : t('offramp_available_balance', {
                                          amount: formatAmount(balance, {
                                              unit: asset.symbol,
                                              exact: true
                                          })
                                      })}
                            </span>
                            <button
                                type="button"
                                onClick={onMax}
                                className="shrink-0 cursor-pointer text-label3 text-accentBlue transition-opacity hover:opacity-80"
                            >
                                {t('send_max')}
                            </button>
                        </div>
                    </div>
                    <div className="min-h-[76px]">
                        {limitError ? (
                            <div className="flex h-[76px] items-center justify-center px-4">
                                <p className="text-center text-body2 text-accentRed">
                                    {limitError}
                                </p>
                            </div>
                        ) : (
                            <ProviderCard
                                quote={selected}
                                fiat={fiat}
                                symbol={asset.symbol}
                                direction="sell"
                                isLoading={quote.isLoading && !selected}
                                image={
                                    selected
                                        ? merchantImageBySlug.get(selected.merchant)
                                        : undefined
                                }
                                isBest={!!selected && selected.merchant === best?.merchant}
                                belowMin={selectedNeedsMin}
                                showSwitch={hasMultipleProviders}
                                onClick={
                                    hasMultipleProviders
                                        ? () => setProviderModalOpen(true)
                                        : undefined
                                }
                            />
                        )}
                    </div>
                </div>
                <ModalFooterPortal>
                    <ModalFooter>
                        <Button
                            loading={isContinueLoading}
                            variant="primaryBlue"
                            size="large"
                            fullWidth
                            onClick={() => selected && onContinue(selected)}
                            disabled={!canContinue}
                        >
                            {t('continue')}
                        </Button>
                    </ModalFooter>
                </ModalFooterPortal>
            </Modal>
            <ChooseProviderModal
                isOpen={providerModalOpen}
                onClose={() => {
                    setProviderModalOpen(false);
                    onClose();
                }}
                onBack={() => setProviderModalOpen(false)}
                items={items}
                suggested={suggested}
                selectedMerchant={selected?.merchant}
                bestMerchant={best?.merchant}
                fiat={fiat}
                symbol={asset.symbol}
                direction="sell"
                merchantImageBySlug={merchantImageBySlug}
                onSelect={onPickProvider}
            />
        </>
    );
};
