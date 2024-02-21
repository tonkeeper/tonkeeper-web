import { FC } from 'react';
import styled from 'styled-components';
import { Body3 } from '../Text';
import { useDateTimeFormat } from '../../hooks/useDateTimeFormat';

const InfoStyled = styled(Body3)`
    display: block;
    padding: 6px 16px;
    color: ${p => p.theme.textSecondary};
`;

const isTrialActive = false; // TODO
const isPurchaseActive = true;
const expirationDate = new Date(Date.now() + 100000000);

export const SubscriptionInfo: FC<{ className?: string }> = ({ className }) => {
    const formatDate = useDateTimeFormat();

    if (isTrialActive) {
        return (
            <InfoStyled className={className}>
                Pro Trial is active. It expires on{' '}
                {formatDate(expirationDate, { day: 'numeric', month: 'short', year: 'numeric' })}
            </InfoStyled>
        );
    }

    if (isPurchaseActive) {
        return (
            <InfoStyled className={className}>
                Pro Subscription is active. It expires on{' '}
                {formatDate(expirationDate, { day: 'numeric', month: 'short', year: 'numeric' })}
            </InfoStyled>
        );
    }

    return null;
};
