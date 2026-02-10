import { styled } from 'styled-components';
import { Body3 } from '../Text';
import { IconButton } from '../fields/IconButton';
import { useState } from 'react';
import { ChevronDownIcon, InfoCircleIcon } from '../Icon';
import { Skeleton } from '../shared/Skeleton';
import {
    priceImpactStatus,
    useIsSwapFormNotCompleted,
    useSwapPriceImpact,
    useSwapToAsset
} from '../../state/swap/useSwapForm';
import { useSwapConfirmation } from '../../state/swap/useSwapStreamEffect';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { useTranslation } from '../../hooks/translation';
import { Accordion } from '../shared/Accordion';
import { TooltipHost, Tooltip } from '../shared/Tooltip';
import BigNumber from 'bignumber.js';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';

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
    const { confirmation, isFetching } = useSwapConfirmation();
    const priceImpact = useSwapPriceImpact();
    const isNotCompleted = useIsSwapFormNotCompleted();
    const [toAsset] = useSwapToAsset();

    if ((!isFetching && !confirmation) || isNotCompleted) {
        return null;
    }

    const onToggleAccordion = () => {
        setIsOpened(v => !v);
    };

    const slippagePercent = confirmation ? confirmation.slippage / 100 : undefined;

    const minimumReceived = confirmation
        ? shiftedDecimals(
              new BigNumber(confirmation.askUnits).multipliedBy(1 - confirmation.slippage / 10000),
              toAsset.decimals
          )
              .decimalPlaces(toAsset.decimals)
              .toString()
        : undefined;

    const gasBudgetTon = confirmation
        ? shiftedDecimals(new BigNumber(confirmation.gasBudget), 9).decimalPlaces(4).toString()
        : undefined;

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
                        {priceImpact === undefined || !confirmation ? (
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
                        {!confirmation ? (
                            <InfoSkeleton />
                        ) : (
                            <Body3>
                                ≈&nbsp;{minimumReceived} {toAsset.symbol}
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
                        {!confirmation ? <InfoSkeleton /> : <Body3>{slippagePercent}%</Body3>}
                    </InfoRowRight>
                </InfoRow>
                <InfoRow>
                    <InfoRowLabel>{t('swap_blockchain_fee')}</InfoRowLabel>
                    <TooltipHost>
                        <InfoCircleIcon />
                    </TooltipHost>
                    <Tooltip placement="top">{t('swap_blockchain_fee_tooltip')}</Tooltip>
                    <InfoRowRight>
                        {!confirmation ? (
                            <InfoSkeleton />
                        ) : (
                            <Body3>≈&nbsp;{gasBudgetTon} TON</Body3>
                        )}
                    </InfoRowRight>
                </InfoRow>
                <InfoRow>
                    <InfoRowLabel>{t('swap_route')}</InfoRowLabel>
                    <InfoRowRight>
                        {!confirmation ? (
                            <InfoSkeleton />
                        ) : (
                            <Body3>{confirmation.resolverName}</Body3>
                        )}
                    </InfoRowRight>
                </InfoRow>
            </Accordion>
        </TxInfoContainer>
    );
};
