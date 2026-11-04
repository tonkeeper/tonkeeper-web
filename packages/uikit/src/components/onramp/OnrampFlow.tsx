import { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import type {
    ExchangeLayoutCard,
    ExchangePaymentMethodType,
    OnrampQuoteResult
} from '@tonkeeper/core/dist/onrampApi';
import { canonicalAssetId } from '@tonkeeper/core/dist/service/chainkit/multichainSwapService';

import {
    DepositRampContext,
    RampSource,
    useDepositFlowAnalytics
} from '../../hooks/analytics/ramp-flow';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useToastMutationError } from '../../hooks/useNotification';
import { Modal } from '../../primitives/Modal';
import {
    useCreateOnrampOrder,
    useCreateP2PSession,
    useDestinationAddress,
    useExchangeLayout,
    useOnrampAsset
} from '../../state/onramp';
import { useUserFiat } from '../../state/fiat';
import { MultichainReceiveBody } from '../receive/MultichainReceiveSheet';
import { AddFundsContent } from './AddFundsSheet';
import { OnrampAssetPicker, OnrampAssetRow } from './ChooseAssetScreen';
import { CurrencyPickerContent } from './CurrencyPickerScreen';
import { EnterAmountContent } from './EnterAmountScreen';
import { PaymentMethodContent, PaymentMethodTopBarTitle } from './PaymentMethodScreen';

type Step =
    | 'add_funds'
    | 'choose_asset'
    | 'payment_method'
    | 'currency_picker'
    | 'enter_amount'
    | 'receive';

export type OnrampFlowEntry = 'add_funds' | 'receive';

export interface OnrampFlowProps {
    isOpen: boolean;
    onClose: () => void;
    /** Screen the flow was started from, for the deposit funnel. */
    from: RampSource;
    /** First screen when no asset is targeted. Defaults to the Add Funds sheet. */
    entry?: OnrampFlowEntry;
    /**
     * Asset the caller already has — a token page, the insufficient-funds
     * dialog. Opens straight on its payment methods, skipping the Add Funds
     * sheet and the asset picker. Symbol and image fill in from the onramp
     * asset detail when omitted.
     */
    buyAsset?: OnrampBuyAsset;
}

export interface OnrampBuyAsset {
    assetId: string;
    symbol?: string;
    image?: string;
}

/** The asset being bought; `symbol` is unknown until the detail loads for an id-only `buyAsset`. */
type SelectedAsset = Omit<OnrampAssetRow, 'symbol'> & { symbol?: string };

const initialStep = (entry: OnrampFlowEntry, buyAsset: OnrampBuyAsset | undefined): Step =>
    buyAsset ? 'payment_method' : entry;

const selectionOf = (buyAsset: OnrampBuyAsset | undefined): SelectedAsset | undefined => {
    if (!buyAsset) return undefined;
    const assetId = canonicalAssetId(buyAsset.assetId);
    return {
        chain: assetId.split('/')[0] || '',
        assetId,
        symbol: buyAsset.symbol,
        image: buyAsset.image
    };
};

/**
 * Buy-with-cash flow: Add Funds sheet → asset → payment method → (currency
 * picker) → amount → order. The sheet also branches to
 * Receive. Creating the order returns the provider's widget URL, which is
 * opened for payment; the wallet receives the crypto from the provider.
 */
export const OnrampFlow: FC<OnrampFlowProps> = ({
    isOpen,
    onClose,
    from,
    entry = 'add_funds',
    buyAsset
}) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const analytics = useDepositFlowAnalytics();
    const toastError = useToastMutationError();
    const [step, setStep] = useState<Step>(() => initialStep(entry, buyAsset));
    const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | undefined>(() =>
        selectionOf(buyAsset)
    );
    const [selectedMethod, setSelectedMethod] = useState<ExchangePaymentMethodType | undefined>(
        undefined
    );
    const [providerOpen, setProviderOpen] = useState(false);
    // Buying fiat — region-derived, set when the user taps a layout card.
    // Intentionally NOT seeded from the app-wide display fiat (which is a
    // separate idea: that one defaults to USD for price/balance display).
    const [preferredFiat, setPreferredFiat] = useState<string | undefined>(undefined);
    // Bumped on every entry so the step screens remount and drop their own
    // search / filter state along with the picks above.
    const [session, setSession] = useState(0);

    // Every entry starts a fresh session: nothing picked in an earlier, closed
    // one (asset, payment method, fiat, quote) carries over. Clearing here
    // rather than on close keeps the last screen intact through the close
    // animation.
    const wasOpen = useRef(isOpen);
    useLayoutEffect(() => {
        const justOpened = isOpen && !wasOpen.current;
        wasOpen.current = isOpen;
        if (!justOpened) return;
        setStep(initialStep(entry, buyAsset));
        setSelectedAsset(selectionOf(buyAsset));
        setSelectedMethod(undefined);
        setProviderOpen(false);
        setPreferredFiat(undefined);
        setSession(n => n + 1);
    }, [isOpen, entry, buyAsset]);

    const {
        data: layout,
        isLoading: isLayoutLoading,
        isError: isLayoutError,
        refetch: refetchLayout
    } = useExchangeLayout('deposit');
    const userFiat = useUserFiat();

    // The sheet and asset picker are skipped for a targeted asset, so their
    // funnel steps are reported on open to keep the deposit funnel continuous.
    const reportedTargetRef = useRef(false);
    useEffect(() => {
        if (!isOpen || !buyAsset) {
            reportedTargetRef.current = false;
            return;
        }
        if (reportedTargetRef.current) return;
        reportedTargetRef.current = true;
        analytics.started(from, ['receive_tokens', 'buy_with_fiat']);
        analytics.optionClick(from, 'buy_with_fiat');
        analytics.clickFiatAsset(from, canonicalAssetId(buyAsset.assetId));
    }, [isOpen, buyAsset, analytics, from]);

    const {
        data: assetDetail,
        isLoading: isAssetDetailLoading,
        isError: isAssetDetailError,
        refetch: refetchAssetDetail
    } = useOnrampAsset(selectedAsset?.assetId);
    const buyingSymbol = selectedAsset?.symbol ?? assetDetail?.symbol;

    // All fiats any provider on the chosen asset supports — the list the
    // currency picker offers and the constraint the auto-fallback respects.
    const availableFiats = useMemo<string[]>(() => {
        if (!assetDetail) return [];
        const set = new Set<string>();
        for (const m of assetDetail.paymentMethods) {
            for (const p of m.providers) set.add(p.fiat);
        }
        return Array.from(set);
    }, [assetDetail]);

    // The card's `preferredCurrency` is the app fiat when the backend supports
    // it (geo-derived otherwise), but the chosen asset may not have a provider
    // that supports it. Mirror iOS: fall back to USD if available, then to
    // whatever the asset offers first.
    const fiat = useMemo<string | undefined>(() => {
        if (!assetDetail) return preferredFiat;
        const available = new Set(availableFiats);
        if (preferredFiat && available.has(preferredFiat)) return preferredFiat;
        if (available.has('USD')) return 'USD';
        return availableFiats[0] ?? preferredFiat;
    }, [assetDetail, availableFiats, preferredFiat]);
    // Where the amount field opens: the largest provider minimum for the
    // chosen method and fiat, rounded up to a whole unit, as on iOS. Known
    // from the asset detail already loaded for the previous step, so the
    // amount screen doesn't have to probe for it.
    const initialAmount = useMemo<string | undefined>(() => {
        if (!assetDetail || !selectedMethod || !fiat) return undefined;
        const method = assetDetail.paymentMethods.find(m => m.type === selectedMethod);
        const mins = (method?.providers ?? [])
            .filter(p => p.fiat === fiat)
            .map(p => p.limits?.min)
            .filter((min): min is number => typeof min === 'number' && min > 0);
        return mins.length ? String(Math.ceil(Math.max(...mins))) : undefined;
    }, [assetDetail, selectedMethod, fiat]);
    const createP2P = useCreateP2PSession();
    const createOrder = useCreateOnrampOrder();
    const destinationAddress = useDestinationAddress(selectedAsset?.assetId);

    const analyticsCtx = useMemo<DepositRampContext>(
        () => ({
            from,
            buyAsset: selectedAsset?.assetId,
            fiat,
            paymentMethod: selectedMethod
        }),
        [from, selectedAsset?.assetId, fiat, selectedMethod]
    );

    const modalOpen = isOpen;

    // View events fire once per screen entry; the refs stop re-renders of an
    // already open screen from repeating them.
    const startedRef = useRef(false);
    useEffect(() => {
        if (!modalOpen || step !== 'add_funds') {
            startedRef.current = false;
            return;
        }
        if (startedRef.current || isLayoutLoading) return;
        startedRef.current = true;
        analytics.started(
            from,
            layout?.items.length ? ['receive_tokens', 'buy_with_fiat'] : ['receive_tokens']
        );
    }, [modalOpen, step, isLayoutLoading, layout, analytics, from]);

    const viewedMethodsRef = useRef<string | undefined>();
    useEffect(() => {
        if (!modalOpen || step !== 'payment_method') {
            viewedMethodsRef.current = undefined;
            return;
        }
        if (!assetDetail || !fiat) return;
        const methods = assetDetail.paymentMethods.map(m => m.type);
        const signature = `${assetDetail.assetId}:${fiat}:${methods.join(',')}`;
        if (viewedMethodsRef.current === signature) return;
        viewedMethodsRef.current = signature;
        analytics.viewFiatPaymentMethod({ ...analyticsCtx, fiat }, methods);
    }, [modalOpen, step, assetDetail, fiat, analytics, analyticsCtx]);

    const placeOrder = (quote: OnrampQuoteResult) => {
        if (!selectedAsset || !destinationAddress || !fiat) return;
        createOrder.mutate(
            {
                targetAssetId: selectedAsset.assetId,
                fiat,
                amount: quote.amountIn,
                destinationAddress,
                paymentMethod: quote.paymentMethod,
                merchant: quote.merchant,
                merchantTransactionId: quote.merchantTransactionId
            },
            {
                onSuccess: order => {
                    analytics.continueToRampProvider(
                        { ...analyticsCtx, provider: quote.merchant },
                        quote
                    );
                    if (order.widgetUrl) {
                        sdk.openPage(order.widgetUrl);
                    }
                    onClose();
                },
                onError: toastError
            }
        );
    };

    const onReceive = () => {
        analytics.optionClick(from, 'receive_tokens');
        setStep('receive');
    };

    const onBuy = (card: ExchangeLayoutCard) => {
        analytics.optionClick(from, 'buy_with_fiat');
        setPreferredFiat(card.preferredCurrency);
        setStep('choose_asset');
    };

    return (
        <Modal
            key={session}
            isOpen={modalOpen}
            onClose={onClose}
            onBack={
                step === 'choose_asset'
                    ? () => setStep('add_funds')
                    : step === 'payment_method'
                    ? buyAsset
                        ? undefined
                        : () => setStep('choose_asset')
                    : step === 'currency_picker'
                    ? () => setStep('payment_method')
                    : step === 'enter_amount'
                    ? providerOpen
                        ? () => setProviderOpen(false)
                        : () => setStep('payment_method')
                    : undefined
            }
            variant={step === 'receive' ? 'alert' : 'content'}
            mobileHeight={
                step === 'choose_asset'
                    ? 'full'
                    : step === 'enter_amount' && !providerOpen
                    ? 'half'
                    : 'auto'
            }
            topBarTitle={
                step === 'add_funds' ? (
                    t('wallet_add_funds')
                ) : step === 'choose_asset' ? (
                    t('add_funds_choose_asset_title')
                ) : step === 'payment_method' ? (
                    <PaymentMethodTopBarTitle
                        title={t('payment_method_title')}
                        subtitle={t('payment_method_subtitle')}
                        fiat={fiat}
                        onChangeFiat={
                            availableFiats.length > 1 ? () => setStep('currency_picker') : undefined
                        }
                    />
                ) : step === 'currency_picker' ? (
                    t('choose_currency_title')
                ) : step === 'enter_amount' ? (
                    providerOpen ? (
                        t('choose_provider_title')
                    ) : (
                        t('enter_amount_title')
                    )
                ) : undefined
            }
        >
            {step === 'add_funds' && (
                <AddFundsContent
                    onReceive={onReceive}
                    onBuy={onBuy}
                    cards={layout?.items}
                    isLoading={isLayoutLoading}
                    isError={isLayoutError}
                    onRetry={refetchLayout}
                />
            )}
            {step === 'receive' && <MultichainReceiveBody />}
            {step === 'choose_asset' && (
                <OnrampAssetPicker
                    onSelect={asset => {
                        analytics.clickFiatAsset(from, asset.assetId);
                        setSelectedAsset(asset);
                        setStep('payment_method');
                    }}
                    selectedAssetId={selectedAsset?.assetId}
                    fiat={preferredFiat ?? userFiat}
                    onViewed={assetIds => analytics.viewFiatChooseAsset(from, assetIds)}
                />
            )}
            {step === 'payment_method' && (
                <PaymentMethodContent
                    assetId={selectedAsset?.assetId}
                    fiat={fiat}
                    methods={assetDetail?.paymentMethods}
                    isLoading={isAssetDetailLoading}
                    isError={isAssetDetailError}
                    onRetry={refetchAssetDetail}
                    onSelect={method => {
                        analytics.clickFiatPaymentMethod({
                            ...analyticsCtx,
                            paymentMethod: method
                        });
                        setSelectedMethod(method);
                        setStep('enter_amount');
                    }}
                    onSelectP2P={() => {
                        if (!selectedAsset || !buyingSymbol || !destinationAddress || !fiat) {
                            return;
                        }
                        analytics.clickFiatPaymentMethod({
                            ...analyticsCtx,
                            paymentMethod: 'p2p'
                        });
                        createP2P.mutate(
                            {
                                wallet: destinationAddress,
                                network: selectedAsset.chain,
                                cryptoCurrency: buyingSymbol,
                                fiatCurrency: fiat
                            },
                            {
                                onSuccess: result => {
                                    analytics.continueToP2pMarket(from);
                                    sdk.openPage(result.deeplinkUrl);
                                    onClose();
                                },
                                onError: toastError
                            }
                        );
                    }}
                />
            )}
            {step === 'currency_picker' && (
                <CurrencyPickerContent
                    allowed={availableFiats}
                    selected={fiat}
                    onBack={() => setStep('payment_method')}
                    onSelect={code => {
                        setPreferredFiat(code);
                        setStep('payment_method');
                    }}
                />
            )}
            {step === 'enter_amount' && selectedAsset && buyingSymbol && selectedMethod && fiat && (
                <EnterAmountContent
                    key={`${selectedAsset.assetId}-${selectedMethod}-${fiat}`}
                    asset={{ assetId: selectedAsset.assetId, symbol: buyingSymbol }}
                    fiat={fiat}
                    paymentMethod={selectedMethod}
                    initialAmount={initialAmount}
                    providerOpen={providerOpen}
                    onProviderOpenChange={setProviderOpen}
                    onProviderViewed={quote =>
                        analytics.viewRampInsertAmount({
                            ...analyticsCtx,
                            provider: quote.merchant
                        })
                    }
                    onContinue={quote => {
                        analytics.clickRampInsertAmountContinue(
                            { ...analyticsCtx, provider: quote.merchant },
                            quote
                        );
                        placeOrder(quote);
                    }}
                    isContinueLoading={createOrder.isLoading}
                />
            )}
        </Modal>
    );
};
