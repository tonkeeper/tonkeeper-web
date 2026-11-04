import { ChangeEvent, FC, useEffect, useMemo, useRef, useState } from 'react';
import type {
    ExchangeMerchantSlug,
    ExchangePaymentMethodType,
    OnrampQuoteResult,
    RampQuote
} from '@tonkeeper/core/dist/onrampApi';
import { Button } from '../../primitives/Button';
import { Loader } from '../../primitives/Loader';
import { Modal, ModalFooter, ModalFooterPortal } from '../../primitives/Modal';
import { useExchangeMerchants, useOnrampQuote } from '../../state/onramp';
import { useTranslation } from '../../hooks/translation';
import { cn } from '../../libs/css';
import { InlineRetryRow } from '../shared/InlineRetryRow';
import { ChooseProviderContent } from './ChooseProviderModal';
import {
    formatAmount,
    fromAmountInput,
    toAmountInput
} from '@tonkeeper/core/dist/utils/numberFormat';
import { ProviderCard } from './ProviderCard';

const DEBOUNCE_MS = 350;

export interface EnterAmountScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    /** Asset chosen earlier in the flow. */
    asset: { assetId: string; symbol: string };
    /** Fiat currency for this purchase (e.g. "USD"). */
    fiat: string;
    /** Payment method chosen on the previous screen. */
    paymentMethod: ExchangePaymentMethodType;
    /**
     * Amount the field opens with — the largest provider minimum for this
     * method and fiat, as the asset detail reports it. When omitted the
     * minimum is learned from a probe quote instead.
     */
    initialAmount?: string;
    /**
     * Called with the selected quote when the user taps Continue. Parent
     * handles the disclaimer modal + `createOnrampOrder` mutation.
     */
    onContinue: (quote: OnrampQuoteResult) => void;
    /** Shows Continue busy while the caller places the order straight from this step. */
    isContinueLoading?: boolean;
    /**
     * Fires when a provider first appears on the card and again each time
     * the shown provider changes, for the "view insert amount" analytics.
     */
    onProviderViewed?: (quote: OnrampQuoteResult) => void;
}

export type EnterAmountContentProps = Omit<
    EnterAmountScreenProps,
    'isOpen' | 'onClose' | 'onBack'
> & {
    providerOpen?: boolean;
    onProviderOpenChange?: (open: boolean) => void;
};

const isValidAmount = (s: string) => /^\d{0,12}(\.\d{0,8})?$/.test(s) && s !== '' && s !== '.';

// Backend mins can carry 10+ decimal places (e.g. `52412.93274092335` RSD).
// Round up to the nearest whole unit so the prefill (a) stays above the
// merchant's min, (b) reads as a clean fiat amount, and (c) passes the
// input's own decimal-count validation.
const cleanFiatAmount = (raw: string): string | undefined => {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return String(Math.ceil(n));
};

export const EnterAmountContent: FC<EnterAmountContentProps> = ({
    asset,
    fiat,
    paymentMethod,
    initialAmount,
    onContinue,
    isContinueLoading,
    onProviderViewed,
    providerOpen = false,
    onProviderOpenChange = () => undefined
}) => {
    const { t } = useTranslation();
    const [amount, setAmount] = useState<string>(initialAmount ?? '');
    const [debouncedAmount, setDebouncedAmount] = useState<string>(initialAmount ?? '');
    const [selectedMerchant, setSelectedMerchant] = useState<ExchangeMerchantSlug | undefined>();

    const quote = useOnrampQuote();
    const merchants = useExchangeMerchants();

    const merchantImageBySlug = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of merchants.data ?? []) {
            if (m.image) map.set(m.id, m.image);
        }
        return map;
    }, [merchants.data]);

    const initialProbeRef = useRef(false);
    const hasPrefilledRef = useRef(!!initialAmount);
    const lastSentRef = useRef<string>('');
    // Nothing from the network shows until the quote for the amount actually
    // in the field has landed. `probing` waits for the mount-time probe at
    // `1`, which exists only to learn the minimum and is not a quote the user
    // should see; `quoting` waits for the request at the prefilled minimum.
    // Without this hold the probe's provider flashes up, gets replaced by a
    // loader, and a different quote lands.
    const [priming, setPriming] = useState<'probing' | 'quoting' | 'done'>(
        initialAmount ? 'quoting' : 'probing'
    );
    const isPriming = priming !== 'done';
    const quoteSettled = !quote.isIdle && !quote.isLoading;

    // First request on mount: the known minimum when the caller has one,
    // otherwise a tiny probe to discover it (matches iOS — the user shouldn't
    // have to guess what the minimum is).
    useEffect(() => {
        if (initialProbeRef.current) return;
        initialProbeRef.current = true;
        const first = initialAmount ?? '1';
        lastSentRef.current = first;
        quote.mutate({
            targetAssetId: asset.assetId,
            fiat,
            amount: first,
            paymentMethod
        });
    }, [initialAmount, asset.assetId, fiat, paymentMethod, quote]);

    // When the probe response lands, prefill the input with the discovered
    // min and re-fire at that value. Gated by `hasPrefilledRef` so the user
    // clearing the field later doesn't snap them back to the min. The probe
    // is the final answer — priming ends right away — when it failed, when
    // there is no minimum to prefill, or when the user has already typed an
    // amount of their own.
    useEffect(() => {
        if (hasPrefilledRef.current) return;
        if (priming === 'probing' && !quoteSettled) return;
        if (priming === 'probing' && (quote.isError || amount !== '')) {
            setPriming('done');
            return;
        }
        if (amount !== '') return;
        const raw = quote.data?.suggested[0]?.minAmount;
        const min = raw ? cleanFiatAmount(raw) : undefined;
        if (!min) {
            setPriming('done');
            return;
        }
        hasPrefilledRef.current = true;
        setAmount(min);
        setDebouncedAmount(min);
        lastSentRef.current = min;
        setPriming('quoting');
        quote.mutate({
            targetAssetId: asset.assetId,
            fiat,
            amount: min,
            paymentMethod
        });
    }, [priming, quoteSettled, amount, quote.data, asset.assetId, fiat, paymentMethod, quote]);

    // Whatever request settles next while quoting — the one at the minimum,
    // or a newer one the user typed in the meantime — is a real quote to show.
    useEffect(() => {
        if (priming === 'quoting' && quoteSettled) setPriming('done');
    }, [priming, quoteSettled]);

    // Debounce amount input → fire quote
    useEffect(() => {
        const handle = window.setTimeout(() => setDebouncedAmount(amount), DEBOUNCE_MS);
        return () => window.clearTimeout(handle);
    }, [amount]);

    useEffect(() => {
        if (!debouncedAmount || !isValidAmount(debouncedAmount)) return;
        if (lastSentRef.current === debouncedAmount) return;
        lastSentRef.current = debouncedAmount;
        quote.mutate({
            targetAssetId: asset.assetId,
            fiat,
            amount: debouncedAmount,
            paymentMethod
        });
    }, [debouncedAmount, asset.assetId, fiat, paymentMethod, quote]);

    const items = useMemo(() => quote.data?.items ?? [], [quote.data?.items]);
    const suggested = useMemo(() => quote.data?.suggested ?? [], [quote.data?.suggested]);
    const best = items[0];

    // Stick to the user's chosen merchant if it still has a valid quote;
    // otherwise fall through to the best one. When the typed amount is
    // below every merchant's minimum, `items` is empty and we fall back to
    // `suggested[0]` so the provider card keeps rendering — the card then
    // surfaces the merchant's minimum in accentOrange instead of a rate.
    const selected = useMemo<OnrampQuoteResult | undefined>(() => {
        if (selectedMerchant) {
            const fromItems = items.find(i => i.merchant === selectedMerchant);
            if (fromItems) return fromItems;
            const fromSuggested = suggested.find(s => s.merchant === selectedMerchant);
            if (fromSuggested) return fromSuggested;
        }
        return best ?? suggested[0];
    }, [items, suggested, selectedMerchant, best]);

    // True when the typed amount is below the selected merchant's minimum.
    // Drives the yellow "Min. amount" line that replaces the rate row.
    const selectedNeedsMin = !!selected && !items.some(i => i.merchant === selected.merchant);

    const viewedMerchantRef = useRef<string | undefined>();
    useEffect(() => {
        if (isPriming || !selected || viewedMerchantRef.current === selected.merchant) return;
        viewedMerchantRef.current = selected.merchant;
        onProviderViewed?.(selected);
    }, [isPriming, selected, onProviderViewed]);

    // Switch chevron only earns its place when the user has a real choice —
    // either multiple valid quotes, or at least one alternative whose
    // minimum is above the typed amount.
    const otherSuggested = suggested.filter(s => !items.some(i => i.merchant === s.merchant));
    const totalProviders = items.length + otherSuggested.length;
    const hasMultipleProviders = totalProviders > 1;

    // Hard errors that should hide the card entirely: country blocked,
    // pair unsupported, or amount above max. Amount-below-min is handled
    // inside the card (yellow min hint) so the user still sees the
    // provider and how far off they are.
    const limitError = useMemo<string | undefined>(() => {
        if (!isValidAmount(amount)) return undefined;
        if (best) return undefined;
        if (quote.isLoading) return undefined;

        const fallback = quote.data?.suggested[0];
        if (fallback) {
            const typed = Number(amount);
            const maxRaw = fallback.maxAmount;
            const max = maxRaw ? Number(maxRaw) : undefined;
            if (maxRaw && max !== undefined && Number.isFinite(max) && typed > max) {
                return t('enter_amount_max_error', { amount: formatAmount(maxRaw), fiat });
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
    }, [amount, best, quote.data, quote.isLoading, fiat, t]);

    const canContinue =
        !isPriming && !!selected && !selectedNeedsMin && !quote.isLoading && isValidAmount(amount);

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = fromAmountInput(e.target.value);
        // Allow empty + partial decimals while typing (e.g. "0.")
        if (value === '' || /^\d{0,12}(\.\d{0,8})?$/.test(value)) {
            setAmount(value);
        }
    };

    const onPressContinue = () => {
        if (!selected) return;
        onContinue(selected);
    };

    // Re-sends the last request as it was — the typed amount stays put.
    const retryQuote = () =>
        quote.mutate({
            targetAssetId: asset.assetId,
            fiat,
            amount: lastSentRef.current || '1',
            paymentMethod
        });

    const onPickProvider = (pickedQuote: RampQuote) => {
        setSelectedMerchant(pickedQuote.merchant);
        // Picking a merchant whose min sits above the typed amount: nudge
        // the field up to that min so the next quote refresh produces a
        // valid `items` entry for them.
        const isInItems = items.some(i => i.merchant === pickedQuote.merchant);
        if (!isInItems && pickedQuote.minAmount) {
            const min = cleanFiatAmount(pickedQuote.minAmount);
            if (min) {
                setAmount(min);
                setDebouncedAmount(min);
            }
        }
        onProviderOpenChange(false);
    };

    if (providerOpen) {
        return (
            <ChooseProviderContent
                items={items}
                suggested={suggested}
                selectedMerchant={selected?.merchant}
                bestMerchant={best?.merchant}
                fiat={fiat}
                symbol={asset.symbol}
                merchantImageBySlug={merchantImageBySlug}
                onSelect={onPickProvider}
            />
        );
    }

    return (
        <>
            <div className="flex flex-col gap-2">
                <AmountCard
                    amount={amount}
                    fiat={fiat}
                    symbol={asset.symbol}
                    onChange={onChange}
                    cryptoOut={
                        selected && !selectedNeedsMin && !isPriming
                            ? formatAmount(selected.amountOut, { unit: asset.symbol })
                            : undefined
                    }
                    isLoading={isPriming || quote.isLoading}
                />
                {/* Reserve the height ProviderCard would take so the input
                    above doesn't jump when an error/loader/quote swaps in. */}
                <div className="min-h-[76px]">
                    {isPriming ? (
                        <ProviderCard
                            quote={undefined}
                            fiat={fiat}
                            symbol={asset.symbol}
                            isLoading
                            isBest={false}
                            belowMin={false}
                            showSwitch={false}
                        />
                    ) : quote.isError ? (
                        <InlineRetryRow
                            text={t('enter_amount_quote_error')}
                            onRetry={retryQuote}
                            className="h-[76px] rounded-medium bg-backgroundContent"
                        />
                    ) : limitError ? (
                        <div className="flex h-[76px] items-center justify-center px-4">
                            <p className="text-center text-body2 text-accentRed">{limitError}</p>
                        </div>
                    ) : (
                        <ProviderCard
                            quote={selected}
                            fiat={fiat}
                            symbol={asset.symbol}
                            isLoading={quote.isLoading && !selected}
                            image={
                                selected ? merchantImageBySlug.get(selected.merchant) : undefined
                            }
                            isBest={!!selected && selected.merchant === best?.merchant}
                            belowMin={selectedNeedsMin}
                            showSwitch={hasMultipleProviders}
                            onClick={
                                hasMultipleProviders ? () => onProviderOpenChange(true) : undefined
                            }
                        />
                    )}
                </div>
            </div>
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant="primaryBlue"
                        size="large"
                        fullWidth
                        onClick={onPressContinue}
                        disabled={!canContinue}
                        loading={isContinueLoading}
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </>
    );
};

export const EnterAmountScreen: FC<EnterAmountScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    ...contentProps
}) => {
    const { t } = useTranslation();
    const [providerOpen, setProviderOpen] = useState(false);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={providerOpen ? () => setProviderOpen(false) : onBack}
            variant="content"
            topBarTitle={providerOpen ? t('choose_provider_title') : t('enter_amount_title')}
            mobileHeight="half"
        >
            <EnterAmountContent
                {...contentProps}
                providerOpen={providerOpen}
                onProviderOpenChange={setProviderOpen}
            />
        </Modal>
    );
};

interface AmountCardProps {
    amount: string;
    fiat: string;
    symbol: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    cryptoOut: string | undefined;
    isLoading: boolean;
}

const AmountCard: FC<AmountCardProps> = ({
    amount,
    fiat,
    symbol,
    onChange,
    cryptoOut,
    isLoading
}) => (
    <div className="flex flex-col items-center gap-3 rounded-medium bg-backgroundContent px-4 py-6">
        <div className="flex w-full max-w-full items-baseline justify-center gap-2 overflow-hidden">
            {/* `field-sizing: content` lets the input auto-grow with its
                value, so long amounts don't clip while the [amount, fiat]
                pair stays visually centered. min-width keeps the caret
                visible when the field is empty. */}
            <input
                value={toAmountInput(amount)}
                onChange={onChange}
                inputMode="decimal"
                placeholder="0"
                aria-label="amount"
                size={1}
                className="[field-sizing:content] min-w-[1ch] max-w-full bg-transparent text-4xl font-bold text-textPrimary outline-none placeholder:text-textTertiary"
            />
            <span className="shrink-0 text-3xl font-bold text-textTertiary">{fiat}</span>
        </div>
        {/* Fixed height: the pill swaps between text and the loader and must
            not move the input above it. A typed amount with no quote (below
            every minimum, or a hard error) has no equivalent to show, and a
            `0` there would read as a real conversion. */}
        <div
            className={cn(
                'flex h-6 max-w-full items-center rounded-full bg-backgroundContentTint px-3 text-body3 text-textSecondary',
                isLoading && cryptoOut && 'opacity-60',
                !cryptoOut && !isLoading && isValidAmount(amount) && 'invisible'
            )}
        >
            {cryptoOut ? (
                <span className="truncate">{cryptoOut}</span>
            ) : isLoading ? (
                <Loader size="xSmall" />
            ) : (
                `0 ${symbol}`
            )}
        </div>
    </div>
);
