import styled from 'styled-components';
import {
    isExpiredSubscription,
    isIosAutoRenewableSubscription,
    isIosCanceledSubscription,
    isIosExpiredSubscription,
    isValidSubscription,
    ProSubscription
} from '@tonkeeper/core/dist/entries/pro';
import {
    getExpirationDate,
    getIosSubscriptionPrice,
    getStatusColor
} from '@tonkeeper/core/dist/utils/pro';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';

import { SlidersIcon } from '../Icon';
import { Body2, Body3, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { useAppSdk } from '../../hooks/appSdk';
import { handleSubmit } from '../../libs/form';
import { ProActiveWallet } from './ProActiveWallet';
import { useTranslation } from '../../hooks/translation';
import { useNotifyError } from '../../hooks/useNotification';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { useManageSubscription, useProLogout } from '../../state/pro';
import { useProAuthNotification } from '../modals/ProAuthNotificationControlled';
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';
import { useProPurchaseNotification } from '../modals/ProPurchaseNotificationControlled';

interface IProps {
    subscription: ProSubscription | undefined;
}

export const IosStatusScreenState = ({ subscription }: IProps) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const formatDate = useDateTimeFormat();

    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const { onOpen: onProPurchaseOpen } = useProPurchaseNotification();
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

    if (!subscription) {
        return null;
    }

    const {
        isIosEnvironment,
        isProActive,
        isProExpired,
        isCanceled,
        isAutoRenew,
        isIosExpired,
        isIosCanceled,
        isIosAutoRenewable,
        isIosActive
    } = getIosStatusFlags(sdk, subscription);

    const handleDisconnect = async () => {
        await mutateProLogout();
        onProAuthOpen();
    };

    return (
        <ProScreenContentWrapper onSubmit={handleSubmit(onProPurchaseOpen)}>
            <ProSubscriptionHeader
                titleKey={isProActive ? 'tonkeeper_pro_is_active' : 'tonkeeper_pro_subscription'}
                subtitleKey={isProActive ? 'subscription_is_linked' : 'pro_unlocks_premium_tools'}
            />

            <ProActiveWallet
                isLoading={isLoggingOut}
                onDisconnect={handleDisconnect}
                isCurrentSubscription
            />

            <ListBlock margin={false} fullWidth>
                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('status')}</Body2RegularStyled>
                        <Body2Styled color={getStatusColor(subscription)}>
                            {t(subscription.status)}
                        </Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>
                            {isProExpired
                                ? t('expiration_date')
                                : t(isAutoRenew ? 'renews' : 'ends')}
                        </Body2RegularStyled>
                        <Body2Styled>{getExpirationDate(subscription, formatDate)}</Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
                {!isProExpired && (
                    <ListItemStyled hover={false}>
                        <ListItemPayloadStyled>
                            <Body2RegularStyled>{t('auto_renew')}</Body2RegularStyled>
                            <Body2Styled color={isCanceled ? 'accentOrange' : undefined}>
                                {t(isCanceled ? 'disabled' : 'enabled')}
                            </Body2Styled>
                        </ListItemPayloadStyled>
                    </ListItemStyled>
                )}
                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('price')}</Body2RegularStyled>
                        <Body2Styled textTransform="unset">
                            {getIosSubscriptionPrice(subscription, t)}
                        </Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('type')}</Body2RegularStyled>
                        <Body2Styled textTransform="unset">{t('in_app_purchase')}</Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
            </ListBlock>

            {isIosAutoRenewable && (
                <Body3Styled>{t('subscription_renews_automatically')}</Body3Styled>
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

                {isProExpired && !isIosEnvironment && (
                    <Button primary fullWidth size="large" type="submit">
                        <Label2>{t('get_tonkeeper_pro')}</Label2>
                    </Button>
                )}

                {(isIosExpired || isIosCanceled) && (
                    <Button primary fullWidth size="large" type="submit">
                        <Label2>{t('renew')}</Label2>
                    </Button>
                )}
            </ButtonsBlockStyled>
        </ProScreenContentWrapper>
    );
};

const getIosStatusFlags = (sdk: IAppSdk, subscription: ProSubscription) => {
    const isIosEnvironment = sdk.targetEnv === 'mobile' || sdk.targetEnv === 'tablet';

    const isProActive = isValidSubscription(subscription);
    const isProExpired = isExpiredSubscription(subscription);

    const isCanceled = isIosCanceledSubscription(subscription);
    const isAutoRenew = isIosAutoRenewableSubscription(subscription);

    const isIosExpired = isIosEnvironment && isIosExpiredSubscription(subscription);
    const isIosCanceled = isIosEnvironment && isIosCanceledSubscription(subscription);
    const isIosAutoRenewable = isIosEnvironment && isIosAutoRenewableSubscription(subscription);
    const isIosActive = isIosCanceled || isIosAutoRenewable;

    return {
        isIosEnvironment,
        isProActive,
        isProExpired,
        isCanceled,
        isAutoRenew,
        isIosExpired,
        isIosCanceled,
        isIosAutoRenewable,
        isIosActive
    };
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

const Body2Styled = styled(Body2)<{
    color?: 'accentOrange' | 'textSecondary';
    textTransform?: 'uppercase' | 'unset';
}>`
    color: ${({ theme, color }) => (color ? theme[color] : theme.textPrimary)};
    text-transform: ${({ textTransform }) => textTransform ?? 'capitalize'};
`;

const Body2RegularStyled = styled(Body2Styled)`
    color: ${({ theme }) => theme.textSecondary};
    font-weight: 400;
    text-transform: capitalize;
`;

const ListItemStyled = styled(ListItem)`
    &:not(:first-child) > div {
        padding-top: 10px;
    }
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    padding-top: 10px;
    padding-bottom: 10px;
`;
