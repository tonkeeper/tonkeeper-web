import styled from 'styled-components';
import {
    isCryptoSubscription,
    isExpiredSubscription,
    isPendingSubscription,
    isValidSubscription,
    ProSubscription
} from '@tonkeeper/core/dist/entries/pro';

import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { useProLogout } from '../../state/pro';
import { handleSubmit } from '../../libs/form';
import { ProActiveWallet } from './ProActiveWallet';
import { useTranslation } from '../../hooks/translation';
import { useNotifyError } from '../../hooks/useNotification';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { getFormattedProPrice } from '@tonkeeper/core/dist/utils/pro';
import { useProAuthNotification } from '../modals/ProAuthNotificationControlled';
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';
import { useProPurchaseNotification } from '../modals/ProPurchaseNotificationControlled';

interface IProps {
    subscription: ProSubscription | undefined;
}

export const CryptoStatusScreenState = ({ subscription }: IProps) => {
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

    if (!subscription || !isCryptoSubscription(subscription)) {
        return null;
    }

    const isProActive = isValidSubscription(subscription);
    const isProExpired = isExpiredSubscription(subscription);

    const handleDisconnect = async () => {
        await mutateProLogout();
        onProAuthOpen();
    };

    const getPrice = () => {
        if (!subscription) return '-';

        if (isPendingSubscription(subscription)) {
            return subscription.displayPrice;
        }

        return getFormattedProPrice(subscription.amount, true);
    };

    const getStatusColor = () => {
        if (!subscription) return undefined;

        if (isPendingSubscription(subscription)) {
            return 'textSecondary';
        }

        if (isExpiredSubscription(subscription)) {
            return 'accentOrange';
        }

        return undefined;
    };

    const getStatusText = () => {
        if (!subscription) return '-';

        if (isPendingSubscription(subscription)) {
            return `${t('processing')}...`;
        }

        return `${t(subscription.status)}`;
    };

    const getExpirationDate = () => {
        try {
            if (isValidSubscription(subscription) && subscription.nextChargeDate) {
                return formatDate(subscription.nextChargeDate, { dateStyle: 'long' });
            }

            if (isExpiredSubscription(subscription) && subscription.expiresDate) {
                return formatDate(subscription.expiresDate, { dateStyle: 'long' });
            }

            return '-';
        } catch (e) {
            console.error('During formatDate error: ', e);

            return '-';
        }
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
                        <Body2Styled color={getStatusColor()}>{getStatusText()}</Body2Styled>
                    </ListItemPayloadStyled>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('expiration_date')}</Body2RegularStyled>
                        <Body2Styled>{getExpirationDate()}</Body2Styled>
                    </ListItemPayloadStyled>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('price')}</Body2RegularStyled>
                        <Body2Styled textTransform="unset">{getPrice()}</Body2Styled>
                    </ListItemPayloadStyled>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('type')}</Body2RegularStyled>
                        <Body2Styled textTransform="unset">{t('crypto_payment')}</Body2Styled>
                    </ListItemPayloadStyled>
                    {subscription?.promoCode && (
                        <ListItemPayloadStyled>
                            <Body2RegularStyled>{t('promo_code')}</Body2RegularStyled>
                            <Body2Styled textTransform="uppercase">
                                {subscription.promoCode}
                            </Body2Styled>
                        </ListItemPayloadStyled>
                    )}
                </ListItemStyled>
            </ListBlock>

            <ButtonsBlockStyled>
                <Button secondary fullWidth type="button" onClick={() => onProFeaturesOpen()}>
                    <Label2>{t('tonkeeper_pro_features')}</Label2>
                </Button>

                {isProExpired && (
                    <Button primary fullWidth size="large" type="submit">
                        <Label2>{t('get_tonkeeper_pro')}</Label2>
                    </Button>
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
