import { useEffect } from 'react';
import styled from 'styled-components';
import {
    isIosStrategy,
    isIosSubscription,
    isProSubscription,
    isTelegramSubscription,
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
import { useNotifyError, useToast } from '../../hooks/useNotification';
import { useManageSubscription, useProLogout, useProState } from '../../state/pro';
import { ProSettingsMainButtonWrapper } from './ProSettingsMainButtonWrapper';
import { handleSubmit } from '../../libs/form';
import { AppRoute } from '../../libs/routes';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';

// TODO Implement different strategies rendering
export const ProStatusScreen = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { data: proState } = useProState();
    const toast = useToast();
    const { onOpen } = useProFeaturesNotification();
    const navigate = useNavigate();

    const subscription = proState?.current;

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

    useEffect(() => {
        if (!isProSubscription(subscription)) {
            navigate(AppRoute.home);
        }
    }, [subscription]);

    const isProActive = isValidSubscription(subscription);

    const isManageAvailable =
        isIosStrategy(sdk.subscriptionStrategy) && isIosSubscription(subscription);

    const handleContinueWithPro = () => {
        onOpen();
    };

    return (
        <ProScreenContentWrapper onSubmit={handleSubmit(handleContinueWithPro)}>
            <ProSubscriptionHeader
                titleKey={isProActive ? 'tonkeeper_pro_is_active' : 'tonkeeper_pro_subscription'}
                subtitleKey={isProActive ? 'subscription_is_linked' : 'pro_unlocks_premium_tools'}
            />

            <ProActiveWallet isLoading={isLoggingOut} onLogout={handleLogOut} />

            <ProStatusDetailsList />

            {isManageAvailable && (
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

            {subscription && isTelegramSubscription(subscription) && (
                <ProSettingsMainButtonWrapper>
                    <Button primary fullWidth size="large" type="submit">
                        <Label2>{t('continue_with_tonkeeper_pro')}</Label2>
                    </Button>
                </ProSettingsMainButtonWrapper>
            )}
        </ProScreenContentWrapper>
    );
};

const ProScreenContentWrapper = styled.form`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: 100%;
    height: 100%;
    max-width: 768px;
    margin: 0 auto;
`;
