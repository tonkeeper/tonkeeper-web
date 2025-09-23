import { useEffect } from 'react';
import { useTranslation } from '../translation';
import { useAppSdk } from '../appSdk';
import { useCurrentSubscriptionInfo } from '../../state/pro';
import { useProAuthNotification } from '../../components/modals/ProAuthNotificationControlled';
import { useProPurchaseNotification } from '../../components/modals/ProPurchaseNotificationControlled';

export const useExistingIosSubscription = () => {
    const sdk = useAppSdk();
    const { data: currentSubInfo } = useCurrentSubscriptionInfo();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const { onClose: onCurrentClose } = useProPurchaseNotification();

    const { t } = useTranslation();

    useEffect(() => {
        if (!currentSubInfo || currentSubInfo.length < 1) return;

        const originalTransactionId = currentSubInfo?.at(-1)?.originalTransactionId;

        if (!originalTransactionId) return;

        (async () => {
            const result = await sdk.confirm({
                message: t('already_have_subscription', {
                    transactionId: String(originalTransactionId)
                }),
                okButtonTitle: t('choose_another_wallet'),
                cancelButtonTitle: t('cancel')
            });

            onCurrentClose();

            if (result) {
                onProAuthOpen();
            }
        })();
    }, [currentSubInfo]);
};
