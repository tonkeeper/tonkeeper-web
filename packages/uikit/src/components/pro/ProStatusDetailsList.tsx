import styled from 'styled-components';
import {
    hasIosPrice,
    isCryptoSubscription,
    isIosSubscription,
    isPaidSubscription,
    isPendingSubscription,
    isProSubscription,
    isTelegramActiveSubscription
} from '@tonkeeper/core/dist/entries/pro';

import { Body2 } from '../Text';
import { SkeletonList } from '../Skeleton';
import { useProState } from '../../state/pro';
import { useTranslation } from '../../hooks/translation';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';
import { HideOnReview } from '../ios/HideOnReview';
import { getFormattedProPrice } from '../../libs/pro';

// TODO Improve this screen after getting the real data from Apple
export const ProStatusDetailsList = () => {
    const { t } = useTranslation();
    const { data, isLoading } = useProState();
    const formatDate = useDateTimeFormat();

    const subscription = data?.subscription;

    if (!subscription || !isProSubscription(subscription)) return null;

    const getDisplayPrice = () => {
        if (isPendingSubscription(subscription)) {
            return subscription.displayPrice;
        }

        if (isCryptoSubscription(subscription) && subscription?.amount) {
            return getFormattedProPrice(subscription?.amount, true);
        }

        if (isIosSubscription(subscription) && hasIosPrice(subscription)) {
            const { price, currency } = subscription;

            if (!price || !currency) {
                return '-';
            }

            const formattedPrice = (price / 100).toFixed(2);

            return `${currency} ${formattedPrice}`;
        }

        return t('free');
    };

    const getDisplayExpirationDate = () => {
        try {
            if (isTelegramActiveSubscription(subscription) && subscription.trialEndDate) {
                return formatDate(subscription.trialEndDate, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            }

            if (isPaidSubscription(subscription) && subscription.nextChargeDate) {
                return formatDate(subscription.nextChargeDate, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
            }

            return '-';
        } catch (e) {
            console.error('During formatDate error: ', e);
            return '-';
        }
    };

    return isLoading ? (
        <SkeletonList fullWidth size={3} />
    ) : (
        <ListBlock margin={false} fullWidth>
            <ListItemStyled hover={false}>
                <ListItemPayloadStyled>
                    <Body2RegularStyled>{t('status')}</Body2RegularStyled>
                    <Body2Styled>{subscription.status}</Body2Styled>
                </ListItemPayloadStyled>
            </ListItemStyled>
            <HideOnReview>
                <ListItemStyled hover={false}>
                    <ListItemPayloadStyled>
                        <Body2RegularStyled>{t('price')}</Body2RegularStyled>
                        <Body2Styled>{getDisplayPrice()}</Body2Styled>
                    </ListItemPayloadStyled>
                </ListItemStyled>
            </HideOnReview>
            <ListItemStyled hover={false}>
                <ListItemPayloadStyled>
                    <Body2RegularStyled>{t('expiration_date')}</Body2RegularStyled>
                    <Body2Styled>{getDisplayExpirationDate()}</Body2Styled>
                </ListItemPayloadStyled>
            </ListItemStyled>
        </ListBlock>
    );
};

const Body2Styled = styled(Body2)`
    color: ${({ theme }) => theme.textPrimary};
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
