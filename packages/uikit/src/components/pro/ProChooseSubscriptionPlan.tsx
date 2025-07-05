import { ChangeEvent, Dispatch, FC, SetStateAction, useEffect } from 'react';
import BigNumber from 'bignumber.js';
import styled, { css } from 'styled-components';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { IDisplayPlan, isCryptoStrategy } from '@tonkeeper/core/dist/entries/pro';

import { useRate } from '../../state/rates';
import { Body2, Body3, Num2 } from '../Text';
import { useAppSdk } from '../../hooks/appSdk';
import { formatter } from '../../hooks/balance';
import { getSkeletonProducts } from '../../libs/pro';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { Skeleton, SkeletonText } from '../shared/Skeleton';
import { normalizeTranslationKey } from '../../libs/common';

interface IProps {
    productsForRender: ReturnType<typeof getSkeletonProducts> | IDisplayPlan[];
    selectedPlan: string;
    onPlanSelection: Dispatch<SetStateAction<string>>;
    isLoading: boolean;
}

export const ProChooseSubscriptionPlan: FC<IProps> = props => {
    const { productsForRender, selectedPlan, onPlanSelection, isLoading } = props;
    const sdk = useAppSdk();
    const { t } = useTranslation();

    useEffect(() => {
        if (selectedPlan || productsForRender?.length < 1) return;

        onPlanSelection(String(productsForRender[0].id));
    }, []);

    const handlePlanSelection = (e: ChangeEvent<HTMLInputElement>) => {
        onPlanSelection(e.target.value);
    };

    return (
        <SubscriptionPlansBlock>
            <Subtitle>{t('choose_plan')}</Subtitle>
            <RadioGroup>
                {productsForRender.map(productProps => {
                    const { id, displayName } = productProps;
                    const isCrypto =
                        isCryptoStrategy(sdk.subscriptionStrategy) &&
                        productProps.displayPrice !== null;

                    const displayPrice = isCrypto
                        ? formatter.fromNano(productProps.displayPrice)
                        : productProps.displayPrice;

                    const titleNode = displayName ? (
                        <Text isBottomMargin={isCrypto}>
                            {t(normalizeTranslationKey(displayName))}
                        </Text>
                    ) : (
                        <SkeletonTextStyled width="100px" margin="0 auto" />
                    );

                    const priceNode = displayPrice ? (
                        <Num2>{isCrypto ? `${displayPrice} TON` : displayPrice}</Num2>
                    ) : (
                        <SkeletonTextStyled height="28px" margin="8px 0 0" width="100%" />
                    );

                    return (
                        <Label key={id} selected={selectedPlan === id}>
                            <input
                                id={`purchase-plan-${id}`}
                                value={id}
                                type="radio"
                                checked={selectedPlan === id}
                                onChange={handlePlanSelection}
                                disabled={isLoading}
                            />
                            {titleNode}
                            {priceNode}
                            {isCrypto && <FiatEquivalent amount={displayPrice} />}
                        </Label>
                    );
                })}
            </RadioGroup>
        </SubscriptionPlansBlock>
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

    try {
        const bigPrice = new BigNumber(rate.prices);
        const bigAmount = new BigNumber(amount);

        if (bigPrice.isNaN() || bigAmount.isNaN()) return null;

        const inFiat = formatter.format(bigPrice.multipliedBy(bigAmount));

        return (
            <Text>
                ≈&nbsp;{inFiat}&nbsp;{fiat}
            </Text>
        );
    } catch (e) {
        console.error('FiatEquivalent error:', e);
        return null;
    }
};

const SkeletonTextStyled = styled(SkeletonText)<{ height?: string; margin?: string }>`
    height: ${p => p.height ?? '20px'};
    margin: ${p => p.margin ?? 0};
`;

const SubscriptionPlansBlock = styled.div`
    width: 100%;
`;

const Text = styled(Body2)<{ isBottomMargin?: boolean }>`
    display: block;
    margin-bottom: ${p => (p.isBottomMargin ? '8px' : 0)};
    color: ${p => p.theme.textSecondary};
`;

const Label = styled.label<{ selected: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    padding: 16px 12px 20px;
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
