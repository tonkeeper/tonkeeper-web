import { type ChangeEvent, type FC, useId } from 'react';
import styled from 'styled-components';
import { IDisplayPlan } from '@tonkeeper/core/dist/entries/pro';

import { Body3, Label2 } from '../Text';
import { Skeleton } from '../shared/Skeleton';
import { useTranslation } from '../../hooks/translation';
import { useFormattedProPrice } from '../../hooks/pro/useFormattedProPrice';

interface IProps extends IDisplayPlan {
    isLoading: boolean;
    selectedPlanId: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const ProPlanLabel: FC<IProps> = props => {
    const skeletonId = useId();
    const { t } = useTranslation();

    const { price, displayName, selectedPlanId, subscriptionPeriod, onChange, isLoading, id } =
        props;

    const { displayPrice, fiatEquivalent } = useFormattedProPrice(price);

    const isDataReady = displayName && price;

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
                <Label2>{` ${displayPrice} / ${t(subscriptionPeriod)}`}</Label2>
                {!!fiatEquivalent && <Text>≈ {fiatEquivalent}</Text>}
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
