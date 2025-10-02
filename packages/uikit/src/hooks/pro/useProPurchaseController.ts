import { useEffect } from 'react';
import {
    IDisplayPlan,
    isPurchaseError,
    PurchaseErrors,
    PurchaseStatuses
} from '@tonkeeper/core/dist/entries/pro';

import { useTranslation } from '../translation';
import { useNavigate } from '../router/useNavigate';
import { useTargetAuthUpdate } from './useTargetAuthUpdate';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useNotifyError, useToast } from '../useNotification';
import {
    useCurrentSubscriptionInfo,
    useManageSubscription,
    useProLogout,
    useProPurchaseMutation
} from '../../state/pro';
import { useProPurchaseNotification } from '../../components/modals/ProPurchaseNotificationControlled';
import { useMetaEncryptionNotification } from '../../components/modals/MetaEncryptionNotificationControlled';
import { useAtomValue } from '../../libs/useAtom';
import { subscriptionFormTempAuth$ } from '@tonkeeper/core/dist/ProAuthTokenService';
import { useMetaEncryptionData } from '../../state/wallet';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { useProAuthNotification } from '../../components/modals/ProAuthNotificationControlled';
import { useAppSdk } from '../appSdk';

interface IOnPurchaseProps {
    plans: IDisplayPlan[];
    selectedSource: SubscriptionSource;
    selectedPlanId: string;
}

export const useProPurchaseController = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const toast = useToast();
    const navigate = useNavigate();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const { onClose: onCurrentClose } = useProPurchaseNotification();
    const { onOpen: onMetaEncryptionOpen, onClose: onMetaEncryptionClose } =
        useMetaEncryptionNotification();
    const { data: metaEncryptionMap } = useMetaEncryptionData();
    const targetAuth = useAtomValue(subscriptionFormTempAuth$);
    const { data: currentSubInfo, isLoading: isIosInfoLoading } = useCurrentSubscriptionInfo();

    useTargetAuthUpdate();

    const {
        data: status,
        mutateAsync: startPurchasing,
        isLoading: isPurchasing,
        isSuccess: isPurchasingSuccess,
        isError: isPurchasingError,
        error: purchaseError
    } = useProPurchaseMutation();

    const {
        mutateAsync: handleLogOut,
        isLoading: isLoggingOut,
        isError: isLogoutError
    } = useProLogout();
    useNotifyError(isLogoutError && new Error(t('logout_failed')));

    const {
        mutateAsync: handleManageSubscription,
        isLoading: isManageLoading,
        isError: isManageError
    } = useManageSubscription();
    useNotifyError(isManageError && new Error(t('manage_unavailable')));

    useEffect(() => {
        if (!isPurchasingError) return;

        const errorMessage = purchaseError?.message;

        if (isPurchaseError(errorMessage)) {
            toast(t(errorMessage));

            return;
        }

        toast(t(PurchaseErrors.PURCHASE_FAILED));
    }, [isPurchasingError]);

    useEffect(() => {
        if (!isPurchasingSuccess) return;

        if (status === PurchaseStatuses.CANCELED) {
            toast(t('purchase_canceled'));

            return;
        }

        if (status === PurchaseStatuses.PENDING) {
            toast(t('purchase_processing'));
        }

        if (status === PurchaseStatuses.SUCCESS) {
            toast(t('purchase_success'));
        }

        onCurrentClose();
        navigate(AppRoute.settings + SettingsRoute.pro, { replace: true });
    }, [isPurchasingSuccess]);

    const handlePurchase = async (props: IOnPurchaseProps) => {
        const { plans, selectedSource, selectedPlanId } = props;

        const selectedPlan = plans.find(plan => plan.id === selectedPlanId);

        if (!targetAuth) return;
        if (!selectedPlan) return;

        if (selectedSource === SubscriptionSource.IOS) {
            if (!currentSubInfo || currentSubInfo.length < 1) {
                toast(t(PurchaseErrors.PURCHASE_FAILED));

                return;
            }

            const originalTransactionId = currentSubInfo?.at(-1)?.originalTransactionId;

            if (!originalTransactionId) {
                toast(t(PurchaseErrors.PURCHASE_FAILED));

                return;
            }

            const result = await sdk.confirm({
                message: t('already_have_subscription', {
                    transactionId: String(originalTransactionId)
                }),
                okButtonTitle: t('choose_another_wallet'),
                cancelButtonTitle: t('cancel')
            });

            if (result) {
                onCurrentClose();
                onProAuthOpen();
            } else {
                toast(t(PurchaseErrors.PURCHASE_FAILED));

                return;
            }
        }

        const hasMetaEncryption =
            metaEncryptionMap && metaEncryptionMap[targetAuth.wallet.rawAddress];

        if (selectedSource === SubscriptionSource.EXTENSION && !hasMetaEncryption) {
            const createMetaEncryption = () =>
                new Promise(resolve => {
                    onMetaEncryptionOpen({
                        onConfirm: (isConfirmed?: boolean) => {
                            if (isConfirmed) {
                                resolve(true);

                                onMetaEncryptionClose();
                            } else {
                                resolve(false);
                            }
                        }
                    });
                });

            const isCreated = await createMetaEncryption();

            if (!isCreated) {
                toast(t('meta_encrypt_key_creation_failed'));

                return;
            }
        }

        await startPurchasing({
            source: selectedSource,
            formData: {
                selectedPlan,
                wallet: targetAuth.wallet,
                tempToken: targetAuth.tempToken
            }
        });
    };

    return {
        states: {
            isPurchasing,
            isLoggingOut,
            isManageLoading,
            isIosInfoLoading
        },
        methods: {
            onLogout: handleLogOut,
            onPurchase: handlePurchase,
            onManage: handleManageSubscription
        }
    };
};
