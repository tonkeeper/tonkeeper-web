import styled from 'styled-components';
import { isValidSubscription, ProSubscription } from '@tonkeeper/core/dist/entries/pro';

import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';
import { handleSubmit } from '../../libs/form';
import { useTranslation } from '../../hooks/translation';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { ProSubscriptionHeader } from './ProSubscriptionHeader';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { useProAuthNotification } from '../modals/ProAuthNotificationControlled';
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';
import { getExpirationDate, getStatusColor } from '@tonkeeper/core/dist/utils/pro';

interface IProps {
    subscription: ProSubscription | undefined;
}

export const TelegramStatusScreenState = ({ subscription }: IProps) => {
    const { t } = useTranslation();
    const { onOpen: onProAuthOpen } = useProAuthNotification();
    const { onOpen: onProFeaturesOpen } = useProFeaturesNotification();
    const formatDate = useDateTimeFormat();

    if (!subscription) {
        return null;
    }

    const isProActive = isValidSubscription(subscription);

    return (
        <ProScreenContentWrapper onSubmit={handleSubmit(onProAuthOpen)}>
            <ProSubscriptionHeader
                titleKey={isProActive ? 'tonkeeper_pro_is_active' : 'tonkeeper_pro_subscription'}
                subtitleKey={isProActive ? 'subscription_is_linked' : 'pro_unlocks_premium_tools'}
            />

            <ListBlock margin={false} fullWidth>
                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('status')}</Body2RegularStyled>
                        <Body2Styled color={getStatusColor(subscription)}>{`${t(
                            subscription.status
                        )} (${t('trial')})`}</Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('expiration_date')}</Body2RegularStyled>
                        <Body2Styled>{getExpirationDate(subscription, formatDate)}</Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('price')}</Body2RegularStyled>
                        <Body2Styled textTransform="unset">{t('free')}</Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
            </ListBlock>

            <ButtonsBlockStyled>
                <Button secondary fullWidth type="button" onClick={() => onProFeaturesOpen()}>
                    <Label2>{t('tonkeeper_pro_features')}</Label2>
                </Button>

                <Button primary fullWidth size="large" type="submit">
                    <Label2>{t('get_tonkeeper_pro')}</Label2>
                </Button>
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
