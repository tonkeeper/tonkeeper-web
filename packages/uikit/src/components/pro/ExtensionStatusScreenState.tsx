import styled from 'styled-components';
import {
    isExpiredSubscription,
    isExtensionActiveSubscription,
    isExtensionAutoRenewableSubscription,
    isExtensionCanceledSubscription,
    isExtensionStrategy,
    isValidSubscription,
    ProSubscription
} from '@tonkeeper/core/dist/entries/pro';

import { Button } from '../fields/Button';
import { useAppSdk } from '../../hooks/appSdk';
import { useProLogout } from '../../state/pro';
import { handleSubmit } from '../../libs/form';
import { Body2, Body3, Label2 } from '../Text';
import { ProActiveWallet } from './ProActiveWallet';
import { useTranslation } from '../../hooks/translation';
import { SubscriptionSource } from '@tonkeeper/core/dist/pro';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import {
    getCryptoSubscriptionPrice,
    getExpirationDate,
    getStatusColor,
    getStatusText
} from '@tonkeeper/core/dist/utils/pro';
import { useNotifyError, useToast } from '../../hooks/useNotification';
import { useProAuthNotification } from '../modals/ProAuthNotificationControlled';
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';
import { useProPurchaseNotification } from '../modals/ProPurchaseNotificationControlled';

interface IProps {
    subscription: ProSubscription | undefined;
}

export const ExtensionStatusScreenState = ({ subscription }: IProps) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const toast = useToast();
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

    if (!subscription) {
        return null;
    }

    const isProActive = isValidSubscription(subscription);
    const isProExpired = isExpiredSubscription(subscription);

    const isCanceled = isExtensionCanceledSubscription(subscription);
    const isAutoRenewable = isExtensionAutoRenewableSubscription(subscription);

    const handleDisconnect = async () => {
        await mutateProLogout();
        onProAuthOpen();
    };

    const handleCancel = async () => {
        const strategy = sdk.subscriptionService.getStrategy(SubscriptionSource.EXTENSION);

        if (!isExtensionStrategy(strategy) || !isExtensionActiveSubscription(subscription)) {
            toast(t('cancel_failed'));

            return;
        }

        await strategy.cancelSubscription(subscription?.contract);
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
                            {getStatusText(subscription, t)}
                        </Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>
                            {isProExpired
                                ? t('expiration_date')
                                : t(isAutoRenewable ? 'renews' : 'ends')}
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
                            {getCryptoSubscriptionPrice(subscription)}
                        </Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('type')}</Body2RegularStyled>
                        <Body2Styled textTransform="unset">{t('crypto_payment')}</Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
            </ListBlock>

            {isAutoRenewable && <Body3Styled>{t('subscription_renews_crypto')}</Body3Styled>}

            <ButtonsBlockStyled>
                <Button secondary fullWidth type="button" onClick={() => onProFeaturesOpen()}>
                    <Label2>{t('tonkeeper_pro_features')}</Label2>
                </Button>

                {isProExpired && (
                    <Button primary fullWidth size="large" type="submit">
                        <Label2>{t('get_tonkeeper_pro')}</Label2>
                    </Button>
                )}

                {isProActive && (
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

const CancelButtonStyled = styled(Button)`
    color: ${p => p.theme.accentRed};
`;

const Body2Styled = styled(Body2)<{
    color?: 'accentOrange' | 'textSecondary';
    textTransform?: 'uppercase' | 'unset';
}>`
    color: ${({ theme, color }) => (color ? theme[color] : theme.textPrimary)};
    text-transform: ${({ textTransform }) => textTransform ?? 'capitalize'};
`;

const Body3Styled = styled(Body3)`
    margin-bottom: 16px;
    color: ${p => p.theme.textSecondary};
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
