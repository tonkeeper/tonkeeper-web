import { type ChangeEvent, type FC, useId } from 'react';
import styled from 'styled-components';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';

import { Body3, Label2 } from '../Text';
import { useRate } from '../../state/rates';
import { Skeleton } from '../shared/Skeleton';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { getFiatEquivalent } from '../../hooks/balance';

interface IProps extends IDisplayPlan {
    isLoading: boolean;
    selectedPlanId: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const ProPlanLabel: FC<IProps> = props => {
    const skeletonId = useId();
    const { t } = useTranslation();

    const {
        displayName,
        selectedPlanId,
        displayPrice,
        subscriptionPeriod,
        formattedDisplayPrice,
        onChange,
        isLoading,
        id
    } = props;

    const isDataReady = displayName && displayPrice && formattedDisplayPrice;

    return isDataReady ? (
        <LabelStyled selected={selectedPlanId === id}>
            <input
                id={`purchase-plan-${id}`}
                value={id}
                type="radio"
                checked={selectedPlanId === id}
                onChange={onChange}
                disabled={isLoading}
            />
            <Label2>{t('price')}</Label2>

            <PriceWrapper>
                <Label2>{` ${formattedDisplayPrice} / ${t(subscriptionPeriod)}`}</Label2>
                <FiatEquivalent amount={displayPrice} />
            </PriceWrapper>
        </LabelStyled>
    ) : (
        <LabelStyled selected={selectedPlanId === id} skeletonId={skeletonId}>
            <input />
            <Label2>{'Skeleton'}</Label2>

            <PriceWrapper>
                <Label2>{'skeleton / skeleton'}</Label2>
            </PriceWrapper>
            <StyledSkeleton id={skeletonId} />
        </LabelStyled>
    );
};

interface IFiatEquivalentProps {
    amount: string | null;
}

const FiatEquivalent: FC<IFiatEquivalentProps> = ({ amount }) => {
    const { fiat } = useAppContext();
    const { data: rate, isLoading } = useRate(CryptoCurrency.TON);

    if (!amount) return null;
    if (!isLoading && !rate?.prices) return null;
    if (isLoading) return <Skeleton width="80px" height="20px" />;

    const inFiat = getFiatEquivalent({
        fiat,
        amount,
        ratePrice: rate?.prices
    });

    return inFiat ? <Text>≈ {inFiat}</Text> : null;
};

const Text = styled(Body3)`
    display: block;
    color: ${p => p.theme.textSecondary};
`;

const LabelStyled = styled.label<{ selected: boolean; skeletonId?: string }>`
    position: relative;
    display: flex;
    flex: 1;
    justify-content: space-between;
    min-width: 0;
    padding: 10px 1rem;
    border-radius: ${props => props.theme.corner2xSmall};
    text-align: center;
    opacity: 1;
    visibility: visible;
    background: ${props => props.theme.fieldBackground};

    ${props =>
        props.skeletonId
            ? `
        & > *:not([id="${props.skeletonId}"]) {
            opacity: 0;
            visibility: hidden;
        }
        `
            : ''}

    input {
        display: none;
    }
`;

const StyledSkeleton = styled(Skeleton)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
`;

const PriceWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: end;
`;
