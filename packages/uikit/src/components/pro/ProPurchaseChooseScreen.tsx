import { Label2 } from '../Text';
import { Button } from '../fields/Button';
import { ProLegalNote } from './ProLegalNote';
import { handleSubmit } from '../../libs/form';
import { ProFeaturesList } from './ProFeaturesList';
import { ProActiveWallet } from './ProActiveWallet';
import { ProPromoCodeInput } from './ProPromoCodeInput';
import { useTranslation } from '../../hooks/translation';
import {
    ConfirmState,
    useCreateInvoiceMutation,
    useManageSubscription,
    useProLogout,
    useProPlans,
    useProState,
    useProSubscriptionPurchase,
    useWaitInvoiceMutation
} from '../../state/pro';
import { ConfirmNotification } from '../settings/ProSettings';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { ProScreenContentWrapper } from './ProScreenContentWrapper';
import { ProChooseSubscriptionPlan } from './ProChooseSubscriptionPlan';
import { ProSettingsMainButtonWrapper } from './ProSettingsMainButtonWrapper';
import { adaptPlansToViewModel, getSkeletonProducts } from '../../libs/pro';
import { useAppSdk } from '../../hooks/appSdk';
import { useEffect, useState } from 'react';
import { useNotifyError, useToast } from '../../hooks/useNotification';
import { useGoToSubscriptionScreen } from '../../hooks/pro/useGoToSubscriptionScreen';
import { SubscriptionScreens } from '../../enums/pro';
import { useQueryClient } from '@tanstack/react-query';
import { anyOfKeysParts, QueryKey } from '../../libs/queryKey';
import {
    CryptoPendingSubscription,
    CryptoSubscriptionStatuses,
    IDisplayPlan,
    IosPurchaseStatuses,
    isCryptoProPlans,
    isCryptoStrategy,
    NormalizedProPlans,
    ProState
} from '@tonkeeper/core/dist/entries/pro';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

const CRYPTO_SKELETON_PRODUCTS_QTY = 1;
const IOS_SKELETON_PRODUCTS_QTY = 2;

export const getFilteredDisplayPlans = (proPlans: NormalizedProPlans | undefined) => {
    return adaptPlansToViewModel(proPlans).filter(plan => plan.formattedDisplayPrice !== '-');
};

export const getProductsForRender = (displayPlans: IDisplayPlan[], isCrypto: boolean) => {
    return displayPlans.length
        ? displayPlans
        : getSkeletonProducts(isCrypto ? CRYPTO_SKELETON_PRODUCTS_QTY : IOS_SKELETON_PRODUCTS_QTY);
};

export const useProductSelection = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    const [promoCode, setPromoCode] = useState('');
    const [selectedPlanId, setSelectedPlanId] = useState('');

    const { data: proPlans, isLoading, isError } = useProPlans(promoCode);
    useNotifyError(isError && new Error(t('failed_subscriptions_loading')));

    const isCrypto = isCryptoStrategy(sdk.subscriptionStrategy);
    const isCryptoPlans = isCryptoProPlans(proPlans);

    const verifiedPromoCode = isCryptoPlans ? proPlans.promoCode : undefined;
    const displayPlans = getFilteredDisplayPlans(proPlans);
    const productsForRender = getProductsForRender(displayPlans, isCrypto);

    useEffect(() => {
        if (productsForRender.length < 1 || !productsForRender[0].displayPrice) {
            setSelectedPlanId('');

            return;
        }

        if (!selectedPlanId) {
            setSelectedPlanId(productsForRender[0].id);
        }
    }, [productsForRender]);

    return {
        plans: displayPlans,
        productsForRender,
        selectedPlanId,
        promoCode,
        setPromoCode,
        verifiedPromoCode,
        setSelectedPlanId,
        isLoading
    };
};

export const useIosPurchaseFlow = () => {
    const toast = useToast();
    const { t } = useTranslation();
    const goTo = useGoToSubscriptionScreen();

    const {
        data: status,
        mutateAsync: startPurchasing,
        isSuccess,
        isLoading,
        isError
    } = useProSubscriptionPurchase();
    useNotifyError(isError && new Error(t('purchase_failed')));

    useEffect(() => {
        if (!isSuccess) return;

        if (status === IosPurchaseStatuses.CANCELED) {
            toast(t('purchase_canceled'));
        } else if (status === IosPurchaseStatuses.PENDING) {
            toast(t('purchase_processing'));
        } else {
            toast(t('purchase_success'));
        }

        goTo(SubscriptionScreens.STATUS);
    }, [isSuccess]);

    return { startPurchasing, isLoading };
};

export const useCryptoPurchaseFlow = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    const { data: proState } = useProState();
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);
    const [savedSelectedPlan, setSavedSelectedPlan] = useState<IDisplayPlan | null>(null);

    const goTo = useGoToSubscriptionScreen();
    const { mutateAsync: createInvoice, isLoading: isInvoiceLoading } = useCreateInvoiceMutation();
    const { mutate: waitInvoice, isLoading: isWaiting } = useWaitInvoiceMutation();

    const startPurchasing = async (selectedPlan: IDisplayPlan, promoCode?: string) => {
        if (!proState?.authorizedWallet) return;

        const confirmState = await createInvoice({
            state: proState,
            tierId: Number(selectedPlan.id),
            promoCode
        });

        setSavedSelectedPlan(selectedPlan);
        setConfirm(confirmState);
    };

    const onConfirmClose = async (success?: boolean) => {
        if (success) {
            const pendingSubscription: CryptoPendingSubscription = {
                ...proState?.subscription,
                displayName: savedSelectedPlan?.displayName,
                displayPrice: savedSelectedPlan?.formattedDisplayPrice,
                source: SubscriptionSource.CRYPTO,
                status: CryptoSubscriptionStatuses.PENDING,
                valid: false,
                usedTrial: proState?.subscription?.usedTrial ?? false
            };

            await sdk.storage.set<ProState>(AppKey.PRO_PENDING_STATE, {
                authorizedWallet: proState?.authorizedWallet || null,
                subscription: pendingSubscription
            });
            await client.invalidateQueries(anyOfKeysParts(QueryKey.pro));

            goTo(SubscriptionScreens.STATUS);
        }

        setConfirm(null);
    };

    return {
        startPurchasing,
        waitInvoice,
        confirm,
        onConfirmClose,
        isLoading: isInvoiceLoading || isWaiting
    };
};

// TODO Make it in react-query way through useMutation when we get rid of web mobile
export const useProPurchaseController = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const isCrypto = isCryptoStrategy(sdk.subscriptionStrategy);

    const {
        plans,
        productsForRender,
        selectedPlanId,
        setSelectedPlanId,
        isLoading: isPlansLoading,
        promoCode,
        setPromoCode,
        verifiedPromoCode
    } = useProductSelection();

    const { startPurchasing: startIosPurchase, isLoading: isIosLoading } = useIosPurchaseFlow();

    const {
        startPurchasing: startCryptoPurchase,
        waitInvoice,
        confirm,
        onConfirmClose,
        isLoading: isCryptoLoading
    } = useCryptoPurchaseFlow();

    const { mutateAsync: handleLogOut, isLoading: isLoggingOut, isError } = useProLogout();
    useNotifyError(isError && new Error(t('logout_failed')));

    const { mutateAsync: handleManageSubscription, isLoading: isManageLoading } =
        useManageSubscription();

    const isLoading =
        isPlansLoading || isIosLoading || isCryptoLoading || isLoggingOut || isManageLoading;

    const onSubmit = async () => {
        const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

        if (!selectedPlan) return;

        if (isCrypto) {
            await startCryptoPurchase(selectedPlan, verifiedPromoCode);
        } else {
            await startIosPurchase(selectedPlan);
        }
    };

    return {
        isCrypto,
        isLoading,
        selectedPlanId,
        setSelectedPlanId,
        productsForRender,
        promoCode,
        setPromoCode,
        verifiedPromoCode,
        onLogout: handleLogOut,
        onManage: handleManageSubscription,
        onSubmit,
        waitInvoice,
        confirmState: confirm,
        onConfirmClose
    };
};

export const ProPurchaseChooseScreen = () => {
    const { t } = useTranslation();
    const {
        isCrypto,
        isLoading,
        selectedPlanId,
        setSelectedPlanId,
        productsForRender,
        promoCode,
        setPromoCode,
        verifiedPromoCode,
        onSubmit,
        onLogout,
        onManage,
        confirmState,
        onConfirmClose,
        waitInvoice
    } = useProPurchaseController();

    return (
        <ProScreenContentWrapper onSubmit={handleSubmit(onSubmit)}>
            <ProSubscriptionHeader
                titleKey="get_tonkeeper_pro"
                subtitleKey="choose_billing_description"
            />

            <ProActiveWallet isLoading={isLoading} onLogout={onLogout} />

            <ProChooseSubscriptionPlan
                isLoading={isLoading}
                selectedPlanId={selectedPlanId}
                onPlanIdSelection={setSelectedPlanId}
                productsForRender={productsForRender}
            />

            {isCrypto && (
                <ProPromoCodeInput
                    value={promoCode}
                    onChange={setPromoCode}
                    promoCode={verifiedPromoCode}
                />
            )}

            <ProFeaturesList />

            <ProSettingsMainButtonWrapper>
                <Button primary fullWidth size="large" type="submit" loading={isLoading}>
                    <Label2>{t('continue_with_tonkeeper_pro')}</Label2>
                </Button>
                <ProLegalNote onManage={onManage} />
            </ProSettingsMainButtonWrapper>

            <ConfirmNotification
                state={confirmState}
                onClose={onConfirmClose}
                waitResult={waitInvoice}
            />
        </ProScreenContentWrapper>
    );
};
