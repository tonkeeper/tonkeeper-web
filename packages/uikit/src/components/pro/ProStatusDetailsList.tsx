import styled from 'styled-components';
import {
    CryptoSubscriptionStatuses,
    isExpiredSubscription,
    isIosAutoRenewableSubscription,
    isIosCanceledSubscription,
    isTelegramSubscription
} from '@tonkeeper/core/dist/entries/pro';

import { Body2 } from '../Text';
import { SkeletonList } from '../Skeleton';
import { useProState } from '../../state/pro';
import { useTranslation } from '../../hooks/translation';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { useProStatusDetailsDisplayData } from '../../hooks/pro/useProStatusDetailsDisplayData';

export const ProStatusDetailsList = () => {
    const { t } = useTranslation();
    const { data, isLoading } = useProState();
    const { price, expirationDate } = useProStatusDetailsDisplayData(data?.current);

    const subscription = data?.current;

    const isExpired = isExpiredSubscription(subscription);
    const isCanceled = isIosCanceledSubscription(subscription);
    const isAutoRenew = isIosAutoRenewableSubscription(subscription);

    const getStatusText = () => {
        if (!subscription) return '-';

        if (subscription.status === CryptoSubscriptionStatuses.PENDING) {
            return `${t('processing')}...`;
        }

        const trialSuffix = isTelegramSubscription(subscription) ? ` (${t('trial')})` : '';

        return `${t(subscription.status)}${trialSuffix}`;
    };

    const getStatusColor = () => {
        if (!subscription) return undefined;

        if (subscription.status === CryptoSubscriptionStatuses.PENDING) {
            return 'textSecondary';
        }

        if (isExpired) {
            return 'accentOrange';
        }

        return undefined;
    };

    const getExpirationTitle = () => {
        if (isAutoRenew || isCanceled) {
            return t(isAutoRenew ? 'renews' : 'ends');
        }

        return t('expiration_date');
    };

    if (isLoading) {
        return <SkeletonList fullWidth size={3} />;
    }

    return (
        <ListBlock margin={false} fullWidth>
            <ListItemStyled hover={false}>
                <ListItemPayloadStyled>
                    <Body2RegularStyled>{t('status')}</Body2RegularStyled>
                    <Body2Styled color={getStatusColor()}>{getStatusText()}</Body2Styled>
                </ListItemPayloadStyled>
            </ListItemStyled>

            <ListItemStyled hover={false}>
                <ListItemPayloadStyled>
                    <Body2RegularStyled>{getExpirationTitle()}</Body2RegularStyled>
                    <Body2Styled>{expirationDate}</Body2Styled>
                </ListItemPayloadStyled>
            </ListItemStyled>

            {(isCanceled || isAutoRenew) && (
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
                    <Body2Styled>{price}</Body2Styled>
                </ListItemPayloadStyled>
            </ListItemStyled>
        </ListBlock>
    );
};

const Body2Styled = styled(Body2)<{
    color?: 'accentOrange' | 'textSecondary';
}>`
    color: ${({ theme, color }) => (color ? theme[color] : theme.textPrimary)};
    text-transform: capitalize;
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
