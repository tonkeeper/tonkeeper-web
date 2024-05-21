import { styled } from 'styled-components';
import { Body3 } from '../Text';
import { SwapTokenSelect } from './SwapTokenSelect';
import { SwapAmountInput } from './SwapAmountInput';
import { useSwapFromAmount, useSwapFromAsset } from '../../state/swap/useSwapForm';
import { SwapAmountFiat } from './SwapAmountFiat';
import { SwapAmountBalance } from './SwapAmountBalance';
import { debounce } from '@tonkeeper/core/dist/utils/common';

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

const SwapAmountInputStyled = styled(SwapAmountInput)`
    flex: 1;
`;

export const SwapFromField = () => {
    const [swapAmount, setSwapAmount] = useSwapFromAmount();
    const [fromAsset, setFromAsset] = useSwapFromAsset();

    return (
        <FiledContainerStyled>
            <FiledHeader>
                <Body3>Send</Body3>
                <SwapAmountBalance asset={fromAsset} onMax={setSwapAmount} />
            </FiledHeader>
            <FieldBody>
                <SwapTokenSelectStyled token={fromAsset} onTokenChange={setFromAsset} />
                <SwapAmountInputStyled
                    value={swapAmount}
                    onChange={debounce(setSwapAmount)}
                    decimals={fromAsset.decimals}
                />
            </FieldBody>
            <FieldFooter>
                <SwapAmountFiat amount={swapAmount} asset={fromAsset} />
            </FieldFooter>
        </FiledContainerStyled>
    );
};
