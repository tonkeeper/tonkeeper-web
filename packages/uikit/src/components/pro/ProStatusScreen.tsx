import styled from 'styled-components';
import {
    isExpiredSubscription,
    isExtensionActiveSubscription,
    isExtensionStrategy,
    isExtensionSubscription,
    isIosAutoRenewableSubscription,
    isIosCanceledSubscription,
    isIosExpiredSubscription,
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
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';
import { useProAuthNotification } from '../modals/ProAuthNotificationControlled';
import { useProPurchaseNotification } from '../modals/ProPurchaseNotificationControlled';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useEffect } from 'react';
import { AppRoute } from '../../libs/routes';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';

export const ProStatusScreen = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const { onOpen: onProPurchaseOpen } = useProPurchaseNotification();
    const { onOpen: onProFeaturesOpen } = useProFeaturesNotification();
    const { data: subscription, isLoading: isProStateLoading } = useProState();

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

    const isIosEnvironment = sdk.targetEnv === 'mobile' || sdk.targetEnv === 'tablet';

    const isTelegram = isTelegramSubscription(subscription);

    const isExtension = isExtensionSubscription(subscription);

    const isProActive = isValidSubscription(subscription);
    const isProExpired = isExpiredSubscription(subscription);

    const isIosExpired = isIosEnvironment && isIosExpiredSubscription(subscription);
    const isIosCanceled = isIosEnvironment && isIosCanceledSubscription(subscription);
    const isIosAutoRenewable = isIosEnvironment && isIosAutoRenewableSubscription(subscription);
    const isIosActive = isIosCanceled || isIosAutoRenewable;

    useEffect(() => {
        if (!subscription && !isProStateLoading) {
            navigate(AppRoute.home);
        }
    }, [subscription, isProStateLoading]);

    const handleGetPro = () => {
        if (isTelegram) {
            onProAuthOpen();
        } else {
            onProPurchaseOpen();
        }
    };

    const handleDisconnect = async () => {
        await mutateProLogout();
        onProAuthOpen();
    };

    const handleCancel = async () => {
        const strategy = sdk.subscriptionService.getStrategy(SubscriptionSource.EXTENSION);

        if (!isExtensionStrategy(strategy) || !isExtensionActiveSubscription(subscription)) return;

        await strategy.cancelSubscription(subscription?.contract);
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

            {isIosAutoRenewable && (
                <Body3Styled>
                    {t(
                        isIosAutoRenewable
                            ? 'subscription_renews_automatically'
                            : 'subscription_renews_crypto'
                    )}
                </Body3Styled>
            )}

            <ButtonsBlockStyled>
                {isIosActive && (
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
                )}

                <Button secondary fullWidth type="button" onClick={() => onProFeaturesOpen()}>
                    <Label2>{t('tonkeeper_pro_features')}</Label2>
                </Button>

                {(isTelegram || (isProExpired && !isIosExpired)) && (
                    <Button primary fullWidth size="large" type="submit">
                        <Label2>{t('get_tonkeeper_pro')}</Label2>
                    </Button>
                )}

                {(isIosExpired || isIosCanceled) && (
                    <Button primary fullWidth size="large" type="submit">
                        <Label2>{t('renew')}</Label2>
                    </Button>
                )}

                {isExtension && (
                    <CancelButtonStyled
                        secondary
                        color="red"
                        fullWidth
                        size="small"
                        type="button"
                        onClick={handleCancel}
                    >
                        <Label2>{t('cancel_subscription')}</Label2>
                    </CancelButtonStyled>
                )}
            </ButtonsBlockStyled>
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

const ButtonsBlockStyled = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 100%;
`;

const Body3Styled = styled(Body3)`
    margin-bottom: 16px;
    color: ${p => p.theme.textSecondary};
`;

const CancelButtonStyled = styled(Button)`
    color: ${p => p.theme.accentRed};
`;
