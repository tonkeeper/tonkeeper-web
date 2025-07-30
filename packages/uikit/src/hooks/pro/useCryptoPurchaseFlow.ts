import { useState } from 'react';
import {
    AuthTypes,
    CryptoPendingSubscription,
    CryptoSubscriptionStatuses,
    hasWalletAuth,
    IDisplayPlan
} from '@tonkeeper/core/dist/entries/pro';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useQueryClient } from '@tanstack/react-query';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

import { useAppSdk } from '../appSdk';
import { useNavigate } from '../router/useNavigate';
import {
    ConfirmState,
    useCreateInvoiceMutation,
    useProState,
    useWaitInvoiceMutation
} from '../../state/pro';
import { anyOfKeysParts, QueryKey } from '../../libs/queryKey';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useProPurchaseNotification } from '../../components/modals/ProPurchaseNotificationControlled';

export const useCryptoPurchaseFlow = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const { onClose } = useProPurchaseNotification();
    const navigate = useNavigate();

    const { data: proState } = useProState();
    const [confirm, setConfirm] = useState<ConfirmState | null>(null);
    const [savedSelectedPlan, setSavedSelectedPlan] = useState<IDisplayPlan | null>(null);

    const { mutateAsync: createInvoice, isLoading: isInvoiceLoading } = useCreateInvoiceMutation();
    const { mutate: waitInvoice, isLoading: isWaiting } = useWaitInvoiceMutation();

    const startPurchasing = async (selectedPlan: IDisplayPlan, promoCode?: string) => {
        if (!proState?.target || !hasWalletAuth(proState.target)) return;

        const confirmState = await createInvoice({
            wallet: proState.target.auth.wallet,
            tierId: Number(selectedPlan.id),
            promoCode
        });

        setSavedSelectedPlan(selectedPlan);
        setConfirm(confirmState);
    };

    const onConfirmClose = async (success?: boolean) => {
        if (success) {
            const auth = proState?.target?.auth;

            if (!auth || auth.type !== AuthTypes.WALLET) {
                throw new Error('Missing wallet auth for pending subscription');
            }

            const pendingSubscription: CryptoPendingSubscription = {
                source: SubscriptionSource.CRYPTO,
                status: CryptoSubscriptionStatuses.PENDING,
                valid: false,
                usedTrial: proState?.target?.usedTrial ?? false,
                displayName: savedSelectedPlan?.displayName,
                displayPrice: savedSelectedPlan?.formattedDisplayPrice,
                auth
            };

            await sdk.storage.set<CryptoPendingSubscription>(
                AppKey.PRO_PENDING_SUBSCRIPTION,
                pendingSubscription
            );

            await client.invalidateQueries(anyOfKeysParts(QueryKey.pro));

            onClose();
            navigate(AppRoute.settings + SettingsRoute.pro, { replace: true });
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
