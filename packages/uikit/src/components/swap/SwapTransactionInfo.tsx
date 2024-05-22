import { css, styled } from 'styled-components';
import { Body3 } from '../Text';
import { IconButton } from '../fields/IconButton';
import { useId, useState } from 'react';
import { ChevronDownIcon, InfoCircleIcon } from '../Icon';
import { Tooltip } from '../shared/Tooltip';
import { Skeleton } from '../shared/Skeleton';
import {
    priceImpactStatus,
    useIsSwapFormNotCompleted,
    useSelectedSwap,
    useSwapOptions,
    useSwapPriceImpact
} from '../../state/swap/useSwapForm';
import { useCalculatedSwap } from '../../state/swap/useCalculatedSwap';
import { getDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';

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

const AccordionAnimation = styled.div<{ isOpened: boolean }>`
    display: grid;
    grid-template-rows: ${p => (p.isOpened ? '1fr' : '0fr')};
    overflow: hidden;
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
`;

const InfoRow = styled.div`
    display: flex;
    padding: 4px 0;
    gap: 6px;
    align-items: center;
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
            : p.status === 'medium'
            ? p.theme.accentOrange
            : p.status === 'high'
            ? p.theme.accentRed
            : p.theme.textSecondary};
`;

export const SwapTransactionInfo = () => {
    const [isOpened, setIsOpened] = useState(true);
    const { isFetching } = useCalculatedSwap();
    const [swap] = useSelectedSwap();
    const priceImpact = useSwapPriceImpact();
    const [{ slippagePercent }] = useSwapOptions();
    const isNotCompleted = useIsSwapFormNotCompleted();

    const priceImpactId = useId();
    const minimumReceivedId = useId();
    const slippageId = useId();
    const blockchainFeeId = useId();
    const routeId = useId();

    const trade = swap?.trade;

    if ((!isFetching && !trade) || isNotCompleted) {
        return null;
    }

    return (
        <TxInfoContainer>
            <TxInfoHeader onClick={() => setIsOpened(s => !s)}>
                <Body3>Transaction Information</Body3>
                <AccordionButton transparent isOpened={isOpened}>
                    <ChevronDownIcon />
                </AccordionButton>
            </TxInfoHeader>
            <AccordionAnimation isOpened={isOpened}>
                <AccordionBody>
                    <AccordionContent>
                        <InfoRow>
                            <InfoRowLabel>Price impact</InfoRowLabel>
                            <div data-tooltip-id={priceImpactId}>
                                <InfoCircleIcon />
                            </div>
                            <Tooltip id={priceImpactId}>TODO</Tooltip>
                            <InfoRowRight>
                                {!priceImpact || !trade ? (
                                    <InfoSkeleton />
                                ) : (
                                    <PriceImpact status={priceImpactStatus(priceImpact)}>
                                        ≈&nbsp;
                                        {priceImpact
                                            ? `${priceImpact
                                                  .multipliedBy(100)
                                                  .decimalPlaces(2)
                                                  .toString()
                                                  .replace('.', getDecimalSeparator())}%`
                                            : 'Unknown price impact'}
                                    </PriceImpact>
                                )}
                            </InfoRowRight>
                        </InfoRow>
                        <InfoRow>
                            <InfoRowLabel>Minimum received</InfoRowLabel>
                            <div data-tooltip-id={minimumReceivedId}>
                                <InfoCircleIcon />
                            </div>
                            <Tooltip id={minimumReceivedId}>TODO</Tooltip>
                            <InfoRowRight>
                                {!trade ? (
                                    <InfoSkeleton />
                                ) : (
                                    <Body3>
                                        ≈&nbsp;
                                        {
                                            new AssetAmount({
                                                weiAmount: trade!.to.weiAmount
                                                    .multipliedBy(100 - slippagePercent)
                                                    .div(100),
                                                asset: trade!.to.asset
                                            }).stringAssetRelativeAmount
                                        }
                                    </Body3>
                                )}
                            </InfoRowRight>
                        </InfoRow>
                        <InfoRow>
                            <InfoRowLabel>Slippage</InfoRowLabel>
                            <div data-tooltip-id={slippageId}>
                                <InfoCircleIcon />
                            </div>
                            <Tooltip id={slippageId}>TODO</Tooltip>
                            <InfoRowRight>
                                {!trade ? <InfoSkeleton /> : <Body3>{slippagePercent}%</Body3>}
                            </InfoRowRight>
                        </InfoRow>
                        <InfoRow>
                            <InfoRowLabel>Blockchain fee</InfoRowLabel>
                            <div data-tooltip-id={blockchainFeeId}>
                                <InfoCircleIcon />
                            </div>
                            <Tooltip id={blockchainFeeId}>TODO</Tooltip>
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
                            <InfoRowLabel>Route</InfoRowLabel>
                            <div data-tooltip-id={routeId}>
                                <InfoCircleIcon />
                            </div>
                            <Tooltip id={routeId}>TODO</Tooltip>
                            <InfoRowRight>
                                {!trade ? (
                                    <InfoSkeleton />
                                ) : (
                                    <Body3>{trade!.path.map(t => t.symbol).join(' → ')}</Body3>
                                )}
                            </InfoRowRight>
                        </InfoRow>
                    </AccordionContent>
                </AccordionBody>
            </AccordionAnimation>
        </TxInfoContainer>
    );
};
