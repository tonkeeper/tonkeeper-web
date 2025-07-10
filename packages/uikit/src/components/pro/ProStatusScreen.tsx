import { useEffect } from 'react';
import {
    isIosStrategy,
    isProSubscription,
    isValidSubscription
} from '@tonkeeper/core/dist/entries/pro';

import { Label2 } from '../Text';
import { SlidersIcon } from '../Icon';
import { Button } from '../fields/Button';
import { useAppSdk } from '../../hooks/appSdk';
import { ProActiveWallet } from './ProActiveWallet';
import { ProFeaturesList } from './ProFeaturesList';
import { useTranslation } from '../../hooks/translation';
import { ProStatusDetailsList } from './ProStatusDetailsList';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { ProScreenContentWrapper } from './ProScreenContentWrapper';
import { useNotifyError, useToast } from '../../hooks/useNotification';
import { useManageSubscription, useProLogout, useProState } from '../../state/pro';

// TODO Implement different strategies rendering
export const ProStatusScreen = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { data: proState } = useProState();
    const toast = useToast();

    const subscription = proState?.subscription;

    const {
        mutateAsync: handleLogOut,
        error: logoutError,
        isLoading: isLoggingOut
    } = useProLogout();
    useNotifyError(logoutError);

    const {
        mutate: handleManageSubscription,
        isLoading: isManagingLoading,
        isError: isManagingError
    } = useManageSubscription();

    useEffect(() => {
        if (isManagingError) {
            toast(t('failed_to_manage'));
        }
    }, []);

    if (!isProSubscription(subscription)) return null;
    const isProActive = isValidSubscription(subscription);

    const isIos = isIosStrategy(sdk.subscriptionStrategy);

    return (
        <ProScreenContentWrapper>
            <ProSubscriptionHeader
                titleKey={isProActive ? 'tonkeeper_pro_is_active' : 'tonkeeper_pro_subscription'}
                subtitleKey={isProActive ? 'subscription_is_linked' : 'pro_unlocks_premium_tools'}
            />

            <ProActiveWallet isLoading={isLoggingOut} onLogout={handleLogOut} />

            <ProStatusDetailsList />

            {isIos && (
                <Button
                    secondary
                    fullWidth
                    onClick={() => handleManageSubscription()}
                    loading={isManagingLoading || isLoggingOut}
                >
                    <SlidersIcon />
                    <Label2>{t('Manage')}</Label2>
                </Button>
            )}

            <ProFeaturesList />
        </ProScreenContentWrapper>
    );
};
