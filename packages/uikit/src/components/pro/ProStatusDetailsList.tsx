import styled from 'styled-components';
import { isIosSubscription, isTelegramSubscription } from '@tonkeeper/core/dist/entries/pro';

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
    const isIos = isIosSubscription(subscription);
    const isAutoRenew = isIos && subscription?.autoRenewStatus;
    const isCanceled = isIos && !subscription?.autoRenewStatus;

    const getStatusText = () => {
        if (!subscription) return '-';

        const baseStatus = isCanceled ? 'canceled' : subscription.status;
        const trialSuffix = isTelegramSubscription(subscription) ? ` (${t('trial')})` : '';

        return `${t(baseStatus)}${trialSuffix}`;
    };

    const getExpirationTitle = () => {
        if (!isIos) {
            return t('expiration_date');
        }

        return t(isAutoRenew ? 'renews' : 'ends');
    };

    if (isLoading) {
        return <SkeletonList fullWidth size={3} />;
    }

    return (
        <ListBlock margin={false} fullWidth>
            <ListItemStyled hover={false}>
                <ListItemPayloadStyled>
                    <Body2RegularStyled>{t('status')}</Body2RegularStyled>
                    <Body2Styled isCanceled={isCanceled}>{getStatusText()}</Body2Styled>
                </ListItemPayloadStyled>
            </ListItemStyled>

            <ListItemStyled hover={false}>
                <ListItemPayloadStyled>
                    <Body2RegularStyled>{getExpirationTitle()}</Body2RegularStyled>
                    <Body2Styled>{expirationDate}</Body2Styled>
                </ListItemPayloadStyled>
            </ListItemStyled>

            <ListItemStyled hover={false}>
                <ListItemPayloadStyled>
                    <Body2RegularStyled>{t('price')}</Body2RegularStyled>
                    <Body2Styled>{price}</Body2Styled>
                </ListItemPayloadStyled>
            </ListItemStyled>
        </ListBlock>
    );
};

const Body2Styled = styled(Body2)<{ isCanceled?: boolean }>`
    color: ${({ theme, isCanceled }) => (isCanceled ? theme.accentOrange : theme.textPrimary)};
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
