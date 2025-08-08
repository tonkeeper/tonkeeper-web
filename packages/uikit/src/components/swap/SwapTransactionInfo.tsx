import { styled } from 'styled-components';
import { Body3 } from '../Text';
import { IconButton } from '../fields/IconButton';
import { useState } from 'react';
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
import { Accordion } from '../shared/Accordion';
import { TooltipHost, Tooltip } from '../shared/Tooltip';

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
        setIsOpened(v => !v);
    };

    return (
        <TxInfoContainer>
            <TxInfoHeader onClick={onToggleAccordion}>
                <Body3>{t('swap_tx_info')}</Body3>
                <AccordionButton transparent isOpened={isOpened}>
                    <ChevronDownIcon />
                </AccordionButton>
            </TxInfoHeader>
            <Accordion isOpened={isOpened}>
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
                    <Tooltip placement="top">{t('swap_minimum_received_tooltip')}</Tooltip>
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
                            <Body3>≈&nbsp;{trade!.blockchainFee.stringAssetRelativeAmount}</Body3>
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
            </Accordion>
        </TxInfoContainer>
    );
};
