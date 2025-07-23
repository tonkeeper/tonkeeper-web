import { useEffect } from 'react';
import styled from 'styled-components';
import {
    isIosStrategy,
    isIosSubscription,
    isProSubscription,
    isTelegramSubscription,
    isValidSubscription
} from '@tonkeeper/core/dist/entries/pro';

import { Body3, Label2 } from '../Text';
import { SlidersIcon } from '../Icon';
import { Button } from '../fields/Button';
import { useAppSdk } from '../../hooks/appSdk';
import { ProActiveWallet } from './ProActiveWallet';
import { useTranslation } from '../../hooks/translation';
import { ProStatusDetailsList } from './ProStatusDetailsList';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { useNotifyError } from '../../hooks/useNotification';
import { useManageSubscription, useProLogout, useProState } from '../../state/pro';
import { handleSubmit } from '../../libs/form';
import { AppRoute } from '../../libs/routes';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';
import { useProAuthNotification } from '../modals/ProAuthNotificationControlled';

export const ProStatusScreen = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { data: proState } = useProState();
    const navigate = useNavigate();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const { onOpen: onProFeaturesOpen } = useProFeaturesNotification();

    const {
        mutateAsync: mutateProLogout,
        isLoading: isLoggingOut,
        isError: isLogoutError
    } = useProLogout();
    useNotifyError(isLogoutError && new Error(t('logout_failed')));

    const {
        mutateAsync: handleManageSubscription,
        isLoading: isManagingLoading,
        isError: isManageError
    } = useManageSubscription();
    useNotifyError(isManageError && new Error(t('manage_unavailable')));

    const subscription = proState?.current;

    useEffect(() => {
        if (!isProSubscription(subscription)) {
            navigate(AppRoute.home);
        }
    }, [subscription]);

    const isProActive = isValidSubscription(subscription);

    const isIos = isIosStrategy(sdk.subscriptionStrategy) && isIosSubscription(subscription);
    const isTelegram = subscription && isTelegramSubscription(subscription);
    const isActiveIos = isIos && isProActive;

    const handleGetPro = () => {
        onProAuthOpen();
    };

    const handleDisconnect = async () => {
        await mutateProLogout();
        onProAuthOpen();
    };

    return (
        <ProScreenContentWrapper onSubmit={handleSubmit(handleGetPro)}>
            <ProSubscriptionHeader
                titleKey={isProActive ? 'tonkeeper_pro_is_active' : 'tonkeeper_pro_subscription'}
                subtitleKey={isProActive ? 'subscription_is_linked' : 'pro_unlocks_premium_tools'}
            />

            {!isTelegram && (
                <ProActiveWallet
                    isLoading={isLoggingOut}
                    onDisconnect={handleDisconnect}
                    isCurrentSubscription
                />
            )}

            <ProStatusDetailsList />

            {isActiveIos && (
                <>
                    <Body3Styled>{t('subscription_renews_automatically')}</Body3Styled>
                    <Button
                        secondary
                        fullWidth
                        type="button"
                        onClick={() => handleManageSubscription()}
                        loading={isManagingLoading || isLoggingOut}
                    >
                        <SlidersIcon />
                        <Label2>{t('Manage')}</Label2>
                    </Button>
                </>
            )}

            <Button secondary fullWidth type="button" onClick={() => onProFeaturesOpen()}>
                <Label2>{t('tonkeeper_pro_features')}</Label2>
            </Button>

            {!isActiveIos && (
                <Button primary fullWidth size="large" type="submit">
                    <Label2>{t('get_tonkeeper_pro')}</Label2>
                </Button>
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
    max-width: 650px;
    margin: 0 auto;
`;

const Body3Styled = styled(Body3)`
    margin-bottom: 16px;
    color: ${p => p.theme.textSecondary};
`;
