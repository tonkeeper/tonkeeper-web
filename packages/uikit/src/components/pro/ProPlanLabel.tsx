import { type ChangeEvent, type FC, useLayoutEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import BigNumber from 'bignumber.js';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { IDisplayPlan, isCryptoStrategy } from '@tonkeeper/core/dist/entries/pro';

import { Body2, Num2 } from '../Text';
import { useRate } from '../../state/rates';
import { useAppSdk } from '../../hooks/appSdk';
import { formatter } from '../../hooks/balance';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { normalizeTranslationKey } from '../../libs/common';
import { Skeleton, SkeletonText } from '../shared/Skeleton';

interface IProps extends IDisplayPlan {
    isLoading: boolean;
    selectedPlanId: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

const MIN_SIZE = 6;
const MAX_SIZE = 28;
const PADDING = 24;

export const ProPlanLabel: FC<IProps> = props => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const [fontSize, setFontSize] = useState(MAX_SIZE);
    const spanRef = useRef<HTMLSpanElement>(null);
    const labelRef = useRef<HTMLLabelElement>(null);
    const resizeObserver = useRef<ResizeObserver>();

    const {
        displayName,
        selectedPlanId,
        displayPrice,
        formattedDisplayPrice,
        onChange,
        isLoading,
        id
    } = props;

    const isCrypto = isCryptoStrategy(sdk.subscriptionStrategy);

    const calculateFontSize = () => {
        if (!labelRef.current || !formattedDisplayPrice) return;

        const parentWidth = labelRef.current.clientWidth;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        const computedFont = window.getComputedStyle(spanRef.current ?? labelRef.current).font;

        if (!computedFont) return;

        const fontFamily = computedFont.split(' ').slice(2).join(' ');
        let low = MIN_SIZE;
        let high = MAX_SIZE;
        let result = MAX_SIZE;

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            ctx.font = `600 ${mid}px ${fontFamily}`;
            const measuredWidth = ctx.measureText(formattedDisplayPrice).width;

            if (measuredWidth + PADDING <= parentWidth) {
                result = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        setFontSize(result ?? MIN_SIZE);
    };

    useLayoutEffect(() => {
        calculateFontSize();

        if (!labelRef.current) return;
        resizeObserver.current?.disconnect();

        resizeObserver.current = new ResizeObserver(() => {
            calculateFontSize();
        });
        resizeObserver.current.observe(labelRef.current);

        return () => resizeObserver.current?.disconnect();
    }, [formattedDisplayPrice]);

    const titleNode = displayName ? (
        <Text isBottomMargin={isCrypto}>{t(normalizeTranslationKey(displayName))}</Text>
    ) : (
        <SkeletonTextStyled width="100px" margin="0 auto" />
    );

    const priceNode = formattedDisplayPrice ? (
        <Num2Styled ref={spanRef} fontSize={fontSize}>
            {formattedDisplayPrice}
        </Num2Styled>
    ) : (
        <SkeletonTextStyled height="28px" margin="8px 0 0" width="100%" />
    );

    return (
        <LabelStyled ref={labelRef} selected={selectedPlanId === id}>
            <input
                id={`purchase-plan-${id}`}
                value={id}
                type="radio"
                checked={selectedPlanId === id}
                onChange={onChange}
                disabled={isLoading}
            />
            {titleNode}
            {priceNode}
            {isCrypto && <FiatEquivalent amount={displayPrice} />}
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

    try {
        const bigPrice = new BigNumber(rate.prices);
        const bigAmount = new BigNumber(formatter.fromNano(amount));

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

const Text = styled(Body2)<{ isBottomMargin?: boolean }>`
    display: block;
    margin-bottom: ${p => (p.isBottomMargin ? '8px' : 0)};
    color: ${p => p.theme.textSecondary};
`;

const Num2Styled = styled(Num2)<{ fontSize: number }>`
    min-width: 0;
    white-space: nowrap;
    font-size: ${p => p.fontSize};
`;

const LabelStyled = styled.label<{ selected: boolean }>`
    display: flex;
    flex: 1;
    flex-direction: column;
    align-items: center;
    min-width: 0;
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

const SkeletonTextStyled = styled(SkeletonText)<{ height?: string; margin?: string }>`
    height: ${p => p.height ?? '20px'};
    margin: ${p => p.margin ?? 0};
`;
