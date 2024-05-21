import { styled } from 'styled-components';
import { Body3, Num2 } from '../Text';
import { SwapTokenSelect } from './SwapTokenSelect';
import { useSwapToAsset } from '../../state/swap/useSwapForm';
import { SwapAmountFiat } from './SwapAmountFiat';
import { SwapAmountBalance } from './SwapAmountBalance';
import { useCalculatedSwap } from '../../state/swap/useCalculatedSwap';
import { Skeleton } from '../shared/Skeleton';

const FiledContainerStyled = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p => p.theme.corner2xSmall};
    padding: 6px 12px;
`;

const FiledHeader = styled.div`
    color: ${p => p.theme.textSecondary};
    gap: 8px;
    display: flex;

    padding: 4px 0;

    > *:first-child {
        margin-right: auto;
    }
`;

const FieldBody = styled.div`
    display: flex;
    gap: 8px;
    padding: 6px 0;
`;

const ToAmountField = styled.div`
    margin-left: auto;
    overflow: auto;

    &::-webkit-scrollbar {
        display: none;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;
`;

const FieldFooter = styled.div`
    display: flex;
    gap: 8px;
    padding: 4px 0;
    align-items: center;
    height: 16px;

    > * {
        margin-left: auto;
    }
`;

const SwapTokenSelectStyled = styled(SwapTokenSelect)`
    flex-shrink: 0;
`;

const Num2Tertiary = styled(Num2)`
    color: ${p => p.theme.textTertiary};
`;

export const SwapToField = () => {
    const [toAsset, setToAsset] = useSwapToAsset();
    const { fetchedSwaps, isFetching } = useCalculatedSwap();

    const bestSwap = fetchedSwaps?.[0];

    return (
        <FiledContainerStyled>
            <FiledHeader>
                <Body3>Receive</Body3>
                <SwapAmountBalance asset={toAsset} />
            </FiledHeader>
            <FieldBody>
                <SwapTokenSelectStyled token={toAsset} onTokenChange={setToAsset} />
                <ToAmountField>
                    {isFetching ? (
                        <Skeleton width="100px" height="28px" margin="4px 0" />
                    ) : bestSwap?.trade ? (
                        <Num2>{bestSwap.trade.to.stringRelativeAmount}</Num2>
                    ) : (
                        <Num2Tertiary>0</Num2Tertiary>
                    )}
                </ToAmountField>
            </FieldBody>
            <FieldFooter>
                <SwapAmountFiat amount={bestSwap?.trade?.to.relativeAmount} asset={toAsset} />
            </FieldFooter>
        </FiledContainerStyled>
    );
};
