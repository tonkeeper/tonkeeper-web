import { css, styled } from 'styled-components';
import { Body2Class, Body3 } from '../Text';
import { IconButton } from '../fields/IconButton';
import { useRef, useState } from 'react';
import { ChevronDownIcon, InfoCircleIcon } from '../Icon';
import { Skeleton } from '../shared/Skeleton';
import {
    priceImpactStatus,
    useIsSwapFormNotCompleted,
    useSelectedSwap,
    useSwapPriceImpact
} from '../../state/swap/useSwapForm';
import { useCalculatedSwap } from '../../state/swap/useCalculatedSwap';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useSwapOptions } from '../../state/swap/useSwapOptions';
import { useTranslation } from '../../hooks/translation';
import { BorderSmallResponsive } from '../shared/Styles';

const TxInfoContainer = styled.div``;

const TxInfoHeader = styled.div`
    cursor: pointer;
    padding: 4px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: ${p => p.theme.textSecondary};

    svg {
        color: ${p => p.theme.textSecondary};
    }
`;

const AccordionContent = styled.div`
    transform: translateY(-100%);
    visibility: hidden;
    transition: transform 0.2s ease-in-out, visibility 0.2s ease-in-out;
`;

const AccordionAnimation = styled.div<{ isOpened: boolean; animationCompleted: boolean }>`
    display: grid;
    grid-template-rows: ${p => (p.isOpened ? '1fr' : '0fr')};
    overflow: ${p => (p.animationCompleted && p.isOpened ? 'visible' : 'hidden')};
    transition: grid-template-rows 0.2s ease-in-out;

    ${AccordionContent} {
        ${p =>
            p.isOpened &&
            css`
                transform: translateY(0);
                visibility: visible;
            `}
    }
`;

const AccordionBody = styled.div`
    min-height: 0;
`;

const AccordionButton = styled(IconButton)<{ isOpened: boolean }>`
    transform: ${p => (p.isOpened ? 'rotate(180deg)' : 'rotate(0deg)')};
    transition: transform 0.2s ease-in-out;
    border: none;
`;

const InfoRow = styled.div`
    position: relative;
    display: flex;
    padding: 4px 0;
    gap: 6px;
    align-items: center;

    > * {
        cursor: default;
    }
`;

const Tooltip = styled.div<{ placement: 'top' | 'bottom' }>`
    pointer-events: none;
    transform: translate3d(0, -10px, 0);
    z-index: 100;
    left: 0;
    right: 0;
    transition: all 0.15s ease-in-out;
    opacity: 0;
    position: absolute;
    background-color: ${p => p.theme.backgroundContentTint};
    padding: 8px 12px;
    ${BorderSmallResponsive};
    ${Body2Class};

    ${p =>
        p.placement === 'top'
            ? css`
                  transform: translate3d(0, 10px, 0);
                  bottom: 30px;
              `
            : css`
                  transform: translate3d(0, -10px, 0);
                  top: 30px;
              `}
`;

const TooltipHost = styled.div`
    cursor: pointer;

    &:hover + ${Tooltip} {
        opacity: 1;
        transform: translate3d(0, 0, 0);
    }
`;

const InfoRowLabel = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const InfoRowRight = styled(Body3)`
    margin-left: auto;
`;

const InfoSkeleton = () => {
    return <Skeleton width="60px" height="12px" margin="2px 0" />;
};

const PriceImpact = styled(Body3)<{ status: ReturnType<typeof priceImpactStatus> }>`
    color: ${p =>
        p.status === 'low'
            ? p.theme.accentGreen
            : p.status === 'medium' || p.status === 'unknown'
            ? p.theme.accentOrange
            : p.theme.accentRed};
`;

export const SwapTransactionInfo = () => {
    const { t } = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const [isAnimationCompleted, setIsAnimationCompleted] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
    const { isFetching } = useCalculatedSwap();
    const [swap] = useSelectedSwap();
    const priceImpact = useSwapPriceImpact();
    const { data: swapOptions } = useSwapOptions();
    const isNotCompleted = useIsSwapFormNotCompleted();

    const trade = swap?.trade;

    if ((!isFetching && !trade) || isNotCompleted) {
        return null;
    }

    const onToggleAccordion = () => {
        clearTimeout(timeoutRef.current);
        if (isOpened) {
            setIsAnimationCompleted(false);
            setIsOpened(false);
        } else {
            setIsOpened(true);
            timeoutRef.current = setTimeout(() => setIsAnimationCompleted(true), 400);
        }
    };

    return (
        <TxInfoContainer>
            <TxInfoHeader onClick={onToggleAccordion}>
                <Body3>{t('swap_tx_info')}</Body3>
                <AccordionButton transparent isOpened={isOpened}>
                    <ChevronDownIcon />
                </AccordionButton>
            </TxInfoHeader>
            <AccordionAnimation isOpened={isOpened} animationCompleted={isAnimationCompleted}>
                <AccordionBody>
                    <AccordionContent>
                        <InfoRow>
                            <InfoRowLabel>{t('swap_price_impact')}</InfoRowLabel>
                            <TooltipHost>
                                <InfoCircleIcon />
                            </TooltipHost>
                            <Tooltip placement="top">{t('swap_price_impact_tooltip')}</Tooltip>
                            <InfoRowRight>
                                {priceImpact === undefined || !trade ? (
                                    <InfoSkeleton />
                                ) : (
                                    <PriceImpact status={priceImpactStatus(priceImpact)}>
                                        {priceImpact ? (
                                            <>
                                                ≈&nbsp;
                                                {`${priceImpact
                                                    .multipliedBy(100)
                                                    .decimalPlaces(2)
                                                    .toString()
                                                    .replace('.', getDecimalSeparator())
                                                    .replace('-', '+')}%`}
                                            </>
                                        ) : (
                                            t('swap_unknown_price_impact')
                                        )}
                                    </PriceImpact>
                                )}
                            </InfoRowRight>
                        </InfoRow>
                        <InfoRow>
                            <InfoRowLabel>{t('swap_minimum_received')}</InfoRowLabel>
                            <TooltipHost>
                                <InfoCircleIcon />
                            </TooltipHost>
                            <Tooltip placement="top">
                                {t('swap_minimum_received_tooltip')}
                            </Tooltip>
                            <InfoRowRight>
                                {!trade || !swapOptions ? (
                                    <InfoSkeleton />
                                ) : (
                                    <Body3>
                                        ≈&nbsp;
                                        {
                                            new AssetAmount({
                                                weiAmount: trade!.to.weiAmount
                                                    .multipliedBy(100 - swapOptions.slippagePercent)
                                                    .div(100),
                                                asset: trade!.to.asset
                                            }).stringAssetRelativeAmount
                                        }
                                    </Body3>
                                )}
                            </InfoRowRight>
                        </InfoRow>
                        <InfoRow>
                            <InfoRowLabel>{t('swap_slippage')}</InfoRowLabel>
                            <TooltipHost>
                                <InfoCircleIcon />
                            </TooltipHost>
                            <Tooltip placement="top">{t('swap_slippage_tooltip')}</Tooltip>
                            <InfoRowRight>
                                {!trade || !swapOptions ? (
                                    <InfoSkeleton />
                                ) : (
                                    <Body3>{swapOptions.slippagePercent}%</Body3>
                                )}
                            </InfoRowRight>
                        </InfoRow>
                        <InfoRow>
                            <InfoRowLabel>{t('swap_blockchain_fee')}</InfoRowLabel>
                            <TooltipHost>
                                <InfoCircleIcon />
                            </TooltipHost>
                            <Tooltip placement="top">{t('swap_blockchain_fee_tooltip')}</Tooltip>
                            <InfoRowRight>
                                {!trade ? (
                                    <InfoSkeleton />
                                ) : (
                                    <Body3>
                                        ≈&nbsp;{trade!.blockchainFee.stringAssetRelativeAmount}
                                    </Body3>
                                )}
                            </InfoRowRight>
                        </InfoRow>
                        <InfoRow>
                            <InfoRowLabel>{t('swap_route')}</InfoRowLabel>
                            <InfoRowRight>
                                {!trade ? (
                                    <InfoSkeleton />
                                ) : (
                                    <Body3>{trade!.path.map(ta => ta.symbol).join(' → ')}</Body3>
                                )}
                            </InfoRowRight>
                        </InfoRow>
                    </AccordionContent>
                </AccordionBody>
            </AccordionAnimation>
        </TxInfoContainer>
    );
};
