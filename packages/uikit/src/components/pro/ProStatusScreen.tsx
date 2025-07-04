import { useEffect } from 'react';
import { isIosStrategy } from '@tonkeeper/core/dist/entries/pro';

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
import { useManageSubscription, useProLogout } from '../../state/pro';
import { useNotifyError, useToast } from '../../hooks/useNotification';
import { HideOnReview } from '../ios/HideOnReview';

// TODO Implement different strategies rendering
export const ProStatusScreen = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const toast = useToast();

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

    const isIos = isIosStrategy(sdk.subscriptionStrategy);

    return (
        <ProScreenContentWrapper>
            <ProSubscriptionHeader
                titleKey="tonkeeper_pro_is_active"
                subtitleKey="subscription_is_linked"
            />
            <ProActiveWallet isLoading={isLoggingOut} onLogout={handleLogOut} />
            {/* tODO Remove it from review */}
            <HideOnReview>
                <ProStatusDetailsList />
            </HideOnReview>
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
