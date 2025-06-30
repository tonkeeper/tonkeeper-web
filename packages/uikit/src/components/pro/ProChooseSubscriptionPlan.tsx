import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { IDisplayPlan, isProductId } from '@tonkeeper/core/dist/entries/pro';

import { Body2, Body3, Num2 } from '../Text';
import { SkeletonText } from '../shared/Skeleton';
import { getSkeletonProducts } from '../../libs/pro';
import { useTranslation } from '../../hooks/translation';
import { normalizeTranslationKey } from '../../libs/common';

interface IProps {
    productsForRender: ReturnType<typeof getSkeletonProducts> | IDisplayPlan[];
    selectedPlan: string;
    onPlanSelection: Dispatch<SetStateAction<string>>;
    isLoading: boolean;
}

export const ProChooseSubscriptionPlan: FC<IProps> = props => {
    const { productsForRender, selectedPlan, onPlanSelection, isLoading } = props;
    const { t } = useTranslation();

    useEffect(() => {
        if (selectedPlan || productsForRender?.length < 1) return;

        onPlanSelection(String(productsForRender[0].id));
    }, [productsForRender, selectedPlan]);

    const handlePlanSelection = (e: ChangeEvent<HTMLInputElement>) => {
        if (isProductId(e.target.value)) {
            onPlanSelection(e.target.value);
        }
    };

    return (
        <SubscriptionPlansBlock>
            <Subtitle>{t('choose_plan')}</Subtitle>
            <RadioGroup>
                {productsForRender.map(productProps => {
                    const { id, displayName, displayPrice } = productProps;

                    const titleNode = displayName ? (
                        <Text>{t(normalizeTranslationKey(displayName))}</Text>
                    ) : (
                        <SkeletonTextStyled width="100px" margin="0 auto" />
                    );

                    const priceNode = displayPrice ? (
                        <Num2>{displayPrice}</Num2>
                    ) : (
                        <SkeletonTextStyled height="28px" margin="8px 0 0" width="100%" />
                    );

                    return (
                        <Label key={id} selected={selectedPlan === id}>
                            <input
                                id={String(id)}
                                value={id}
                                type="radio"
                                checked={selectedPlan === id}
                                onChange={handlePlanSelection}
                                disabled={isLoading}
                            />
                            {titleNode}
                            {priceNode}
                        </Label>
                    );
                })}
            </RadioGroup>
        </SubscriptionPlansBlock>
    );
};

const SkeletonTextStyled = styled(SkeletonText)<{ height?: string; margin?: string }>`
    height: ${p => p.height ?? '20px'};
    margin: ${p => p.margin ?? 0};
`;

const SubscriptionPlansBlock = styled.form`
    width: 100%;
`;

const Text = styled(Body2)`
    display: block;
    color: ${p => p.theme.textSecondary};
`;

const Label = styled.label<{ selected: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 12px 16px 20px;
    border-radius: ${props => props.theme.corner2xSmall};
    cursor: pointer;
    text-align: center;
    transition: all 0.2s;

    input {
        display: none;
    }

    ${props =>
        props.selected
            ? css`
                  border: 1px solid ${props.theme.fieldActiveBorder};
                  background: ${props.theme.fieldBackground};
              `
            : css`
                  border: 1px solid transparent;
                  background: ${props.theme.fieldBackground};
              `}
`;

const RadioGroup = styled.fieldset`
    border: none;
    display: flex;
    gap: 8px;
    padding: 0;
    margin: 0;
`;

const Subtitle = styled(Body3)`
    margin-bottom: 8px;
    max-width: 576px;
    display: block;
    color: ${p => p.theme.textSecondary};
    text-align: left;
`;
