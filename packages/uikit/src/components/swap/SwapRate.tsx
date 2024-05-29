import { FC, useState } from 'react';

import { Skeleton } from '../shared/Skeleton';
import { Body3 } from '../Text';
import { css, styled } from 'styled-components';
import {
    priceImpactStatus,
    useSelectedSwap,
    useSwapPriceImpact
} from '../../state/swap/useSwapForm';
import { useCalculatedSwap } from '../../state/swap/useCalculatedSwap';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';

const Body3Styled = styled(Body3)<{ impact: 'unknown' | 'low' | 'medium' | 'high' }>`
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${p =>
        p.impact === 'medium'
            ? p.theme.accentOrange
            : p.impact === 'high'
            ? p.theme.accentRed
            : p.theme.textSecondary};
    cursor: pointer;
    transition: color 0.15s ease-in-out;

    &:hover {
        ${p =>
            p.impact !== 'medium' &&
            p.impact !== 'high' &&
            css`
                color: ${p.theme.textPrimary};
            `};
    }
`;

const WarnIcon = () => {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.18144 1.65C4.63413 0.86592 4.86047 0.473881 5.11842 0.286474C5.64415 -0.0954914 6.35604 -0.0954914 6.88177 0.286474C7.13971 0.473881 7.36606 0.86592 7.81875 1.65L11.1096 7.35L11.1097 7.35001C11.5623 8.13408 11.7887 8.52612 11.822 8.84321C11.8899 9.48949 11.534 10.106 10.9403 10.3703C10.6491 10.5 10.1964 10.5 9.29099 10.5H2.7092C1.80382 10.5 1.35113 10.5 1.05986 10.3703C0.466204 10.106 0.110258 9.48949 0.178184 8.84321C0.211512 8.52612 0.437856 8.13408 0.890544 7.35L4.18144 1.65ZM5.1001 8.1C5.1001 7.60294 5.50304 7.2 6.0001 7.2C6.49715 7.2 6.9001 7.60294 6.9001 8.1C6.9001 8.59706 6.49715 9 6.0001 9C5.50304 9 5.1001 8.59706 5.1001 8.1ZM6.00002 2C5.53718 2 5.16822 2.38674 5.18997 2.84906L5.31946 5.60072C5.33656 5.96414 5.63619 6.25 6.00002 6.25C6.36384 6.25 6.66347 5.96414 6.68057 5.60072L6.81006 2.84906C6.83182 2.38674 6.46285 2 6.00002 2Z"
                fill="currentColor"
            />
        </svg>
    );
};

export const SwapRate: FC = () => {
    const [measureUnit, setMeasureUnit] = useState<'from' | 'to'>('from');
    const [selectedSwap] = useSelectedSwap();
    const { isFetching } = useCalculatedSwap();
    const priceImpact = useSwapPriceImpact();

    const isLoading = (isFetching && !selectedSwap?.trade) || priceImpact === undefined;
    const isHidden = !isFetching && !selectedSwap?.trade;

    if (isHidden) {
        return null;
    }

    if (isLoading) {
        return <Skeleton width="100px" height="12px" margin="2px 0" />;
    }

    const trade = selectedSwap!.trade!;
    const leftPart = measureUnit === 'from' ? trade.from : trade.to;
    const rightPart = measureUnit === 'from' ? trade.to : trade.from;

    if (leftPart.relativeAmount.isZero()) {
        return null;
    }

    const rightPartAmount = rightPart.relativeAmount.div(leftPart.relativeAmount);
    const rightPartAssetAmount = AssetAmount.fromRelativeAmount({
        amount: rightPartAmount,
        asset: rightPart.asset
    });

    const impact = priceImpactStatus(priceImpact);

    return (
        <Body3Styled
            impact={impact}
            onClick={() => setMeasureUnit(s => (s === 'from' ? 'to' : 'from'))}
        >
            1&nbsp;{leftPart.asset.symbol}&nbsp;≈&nbsp;
            {rightPartAssetAmount.stringAssetRelativeAmount}
            {(impact === 'medium' || impact === 'high') && <WarnIcon />}
        </Body3Styled>
    );
};
