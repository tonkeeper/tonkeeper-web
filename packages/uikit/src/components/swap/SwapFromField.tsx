import { styled } from 'styled-components';
import { Body3 } from '../Text';
import { SwapTokenSelect } from './SwapTokenSelect';
import { SwapAmountInput } from './SwapAmountInput';
import { useMaxSwapValue, useSwapFromAmount, useSwapFromAsset } from '../../state/swap/useSwapForm';
import { SwapAmountFiat } from './SwapAmountFiat';
import { SwapFromAmountBalance } from './SwapAmountBalance';
import { debounce } from '@tonkeeper/core/dist/utils/common';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { FC, PropsWithChildren } from 'react';
import { useTranslation } from '../../hooks/translation';

const FiledContainerStyled = styled.div`
    position: relative;
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
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

    > * {
        cursor: default;
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

export const SwapFromField: FC<PropsWithChildren> = ({ children }) => {
    const { t } = useTranslation();
    const [swapAmount, setSwapAmount] = useSwapFromAmount();
    const [fromAsset, setFromAsset] = useSwapFromAsset();
    const { data: max } = useMaxSwapValue();

    return (
        <FiledContainerStyled>
            <FiledHeader>
                <Body3>{t('swap_send')}</Body3>
                <SwapFromAmountBalance />
            </FiledHeader>
            <FieldBody>
                <SwapTokenSelectStyled token={fromAsset} onTokenChange={setFromAsset} />
                <SwapAmountInputStyled
                    value={swapAmount}
                    onChange={debounce(setSwapAmount)}
                    decimals={fromAsset.decimals}
                    isErrored={
                        !!max &&
                        !!swapAmount &&
                        swapAmount.gt(shiftedDecimals(max, fromAsset.decimals))
                    }
                />
            </FieldBody>
            <FieldFooter>
                <SwapAmountFiat amount={swapAmount} asset={fromAsset} />
            </FieldFooter>
            {children}
        </FiledContainerStyled>
    );
};
