import { FC, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import type { ExchangePaymentMethodType } from '@tonkeeper/core/dist/onrampApi';
import type { OfframpQuoteResult } from '@tonkeeper/core/dist/offrampApi';

import { useAppContext } from '../../hooks/appContext';
import { useWithdrawFlowAnalytics, WithdrawRampContext } from '../../hooks/analytics/ramp-flow';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { useCreateP2PSession, useDestinationAddress } from '../../state/onramp';
import { useCreateOfframpOrder, useOfframpAsset } from '../../state/offramp';
import { CurrencyPickerScreen } from '../onramp/CurrencyPickerScreen';
import { PaymentMethodScreen } from '../onramp/PaymentMethodScreen';
import { OfframpEnterAmountScreen } from './OfframpEnterAmountScreen';

type Step = 'payout_method' | 'currency_picker' | 'enter_amount';

export interface OfframpFlowProps {
    isOpen: boolean;
    onClose: () => void;
    /** The wallet asset being sold. The flow always starts with an asset. */
    asset: MultichainWalletAsset;
}

/**
 * Sell-to-cash flow: payout method → (currency picker) → amount → order.
 * Creating the order returns the provider's widget URL, which is opened for
 * KYC and payout details; the provider then tells the user where to send the
 * crypto. The wallet does not send anything itself.
 */
export const OfframpFlow: FC<OfframpFlowProps> = ({ isOpen, onClose, asset }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { fiat: appFiat } = useAppContext();
    const [step, setStep] = useState<Step>('payout_method');
    const [selectedMethod, setSelectedMethod] = useState<ExchangePaymentMethodType | undefined>();
    const [preferredFiat, setPreferredFiat] = useState<string | undefined>();

    const wasOpen = useRef(isOpen);
    useLayoutEffect(() => {
        const justOpened = isOpen && !wasOpen.current;
        wasOpen.current = isOpen;
        if (!justOpened) return;
        setStep('payout_method');
        setSelectedMethod(undefined);
        setPreferredFiat(undefined);
    }, [isOpen]);

    const {
        data: assetDetail,
        isLoading: isAssetDetailLoading,
        isError: isAssetDetailError,
        refetch: refetchAssetDetail
    } = useOfframpAsset(isOpen ? asset.assetId : undefined);

    const availableFiats = useMemo<string[]>(() => {
        if (!assetDetail) return [];
        const set = new Set<string>();
        for (const m of assetDetail.payoutMethods) {
            for (const p of m.providers) set.add(p.fiat);
        }
        return Array.from(set);
    }, [assetDetail]);

    // The app fiat when some provider pays out in it, else USD, else the
    // first fiat any provider offers.
    const fiat = useMemo<string | undefined>(() => {
        if (!assetDetail) return preferredFiat ?? appFiat;
        const available = new Set(availableFiats);
        if (preferredFiat && available.has(preferredFiat)) return preferredFiat;
        if (available.has(appFiat)) return appFiat;
        if (available.has('USD')) return 'USD';
        return availableFiats[0] ?? preferredFiat ?? appFiat;
    }, [assetDetail, availableFiats, preferredFiat, appFiat]);

    const fromAddress = useDestinationAddress(asset.assetId);
    const createOrder = useCreateOfframpOrder();
    const createP2P = useCreateP2PSession();

    // The only entry point today is the asset page.
    const analytics = useWithdrawFlowAnalytics();
    const analyticsCtx = useMemo<WithdrawRampContext>(
        () => ({
            from: 'jetton_screen',
            sellAsset: asset.assetId,
            fiat,
            paymentMethod: selectedMethod
        }),
        [asset.assetId, fiat, selectedMethod]
    );

    useEffect(() => {
        if (!isOpen) return;
        analytics.started('jetton_screen');
        analytics.optionClick('jetton_screen');
    }, [isOpen, analytics]);

    // One view event per loaded method list, so a refetch of the same asset
    // doesn't double-count.
    const viewedMethodsRef = useRef<string | undefined>();
    useEffect(() => {
        if (!isOpen || step !== 'payout_method' || !assetDetail || !fiat) return;
        const methods = assetDetail.payoutMethods.map(m => m.type);
        const signature = `${fiat}:${methods.join(',')}`;
        if (viewedMethodsRef.current === signature) return;
        viewedMethodsRef.current = signature;
        analytics.viewFiatPaymentMethod({ ...analyticsCtx, fiat }, methods);
    }, [isOpen, step, assetDetail, fiat, analytics, analyticsCtx]);

    const placeOrder = (quote: OfframpQuoteResult) => {
        if (!fromAddress || !fiat) return;
        createOrder.mutate(
            {
                sourceAssetId: asset.assetId,
                fiat,
                amount: quote.amountIn,
                fromAddress,
                payoutMethod: quote.payoutMethod,
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
                }
            }
        );
    };

    return (
        <>
            <PaymentMethodScreen
                isOpen={isOpen && step === 'payout_method'}
                onClose={onClose}
                title={t('offramp_payment_method_title')}
                subtitle={t('offramp_payment_method_subtitle')}
                assetId={asset.assetId}
                fiat={fiat}
                methods={assetDetail?.payoutMethods}
                isLoading={isAssetDetailLoading}
                isError={isAssetDetailError}
                onRetry={refetchAssetDetail}
                onChangeFiat={
                    availableFiats.length > 1 ? () => setStep('currency_picker') : undefined
                }
                onSelect={method => {
                    analytics.clickFiatPaymentMethod({ ...analyticsCtx, paymentMethod: method });
                    setSelectedMethod(method);
                    setStep('enter_amount');
                }}
                onSelectP2P={() => {
                    if (!fromAddress || !fiat) return;
                    createP2P.mutate(
                        {
                            wallet: fromAddress,
                            // The asset-id prefix (`eth`, `bsc`, `tron`), not
                            // the wallet chain id, which folds every EVM
                            // network into `evm`.
                            network: asset.assetId.split('/')[0] || '',
                            cryptoCurrency: asset.symbol,
                            fiatCurrency: fiat
                        },
                        {
                            onSuccess: result => {
                                sdk.openPage(result.deeplinkUrl);
                                onClose();
                            }
                        }
                    );
                }}
            />
            <CurrencyPickerScreen
                isOpen={isOpen && step === 'currency_picker'}
                onClose={onClose}
                onBack={() => setStep('payout_method')}
                allowed={availableFiats}
                selected={fiat}
                onSelect={code => {
                    setPreferredFiat(code);
                    setStep('payout_method');
                }}
            />
            {selectedMethod && fiat && (
                <OfframpEnterAmountScreen
                    key={`${asset.assetId}-${selectedMethod}-${fiat}`}
                    isOpen={isOpen && step === 'enter_amount'}
                    onClose={onClose}
                    onBack={() => setStep('payout_method')}
                    asset={asset}
                    fiat={fiat}
                    payoutMethod={selectedMethod}
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
        </>
    );
};
