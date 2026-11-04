import { styled } from 'styled-components';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { Body3 } from '../Text';
import { LegacyIconButton } from '../fields/IconButton';
import { useState } from 'react';
import { ChevronDownIcon, InfoCircleIcon } from '../Icon';
import { Skeleton } from '../shared/Skeleton';
import {
    useIsSwapFormNotCompleted,
    useSwapToAsset,
    useSwapValueDifferenceBps,
    ValueDifferenceStatus,
    valueDifferenceStatus
} from '../../state/swap/useSwapForm';
import { useSwapConfirmation } from '../../state/swap/useSwapStreamEffect';
import { useTranslation } from '../../hooks/translation';
import { Accordion } from '../shared/Accordion';
import { TooltipHost, Tooltip } from '../shared/Tooltip';
import BigNumber from 'bignumber.js';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { formatPercent } from '@tonkeeper/core/dist/utils/numberFormat';

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

const AccordionButton = styled(LegacyIconButton)<{ isOpened: boolean }>`
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

const ValueDifference = styled(Body3)<{ status: ValueDifferenceStatus }>`
    color: ${p =>
        p.status === 'danger'
            ? p.theme.accentRed
            : p.status === 'warning'
            ? p.theme.accentOrange
            : p.theme.textPrimary};
`;

export const SwapTransactionInfo = () => {
    const { t } = useTranslation();
    const [isOpened, setIsOpened] = useState(false);
    const { confirmation, isFetching } = useSwapConfirmation();
    const valueDifferenceBps = useSwapValueDifferenceBps();
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
                {valueDifferenceBps !== undefined && (
                    <InfoRow>
                        <InfoRowLabel>{t('multichain_swap_value_difference')}</InfoRowLabel>
                        <TooltipHost>
                            <InfoCircleIcon />
                        </TooltipHost>
                        <Tooltip placement="top">
                            {t('multichain_swap_value_difference_info')}
                        </Tooltip>
                        <InfoRowRight>
                            <ValueDifference status={valueDifferenceStatus(valueDifferenceBps)}>
                                {formatPercent(valueDifferenceBps / 100, { signed: true })}
                            </ValueDifference>
                        </InfoRowRight>
                    </InfoRow>
                )}
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
                            <Body3>
                                ≈&nbsp;{gasBudgetTon} {BRAND_CONFIG.coinSymbol}
                            </Body3>
                        )}
                    </InfoRowRight>
                </InfoRow>
                <InfoRow>
                    <InfoRowLabel>{t('swap_provider')}</InfoRowLabel>
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
