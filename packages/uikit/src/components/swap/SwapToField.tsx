import { styled } from 'styled-components';
import { Body3, Num2 } from '../Text';
import { SwapTokenSelect } from './SwapTokenSelect';
import { useSwapToAsset } from '../../state/swap/useSwapForm';
import { SwapAmountFiat } from './SwapAmountFiat';
import { SwapToAmountBalance } from './SwapAmountBalance';
import { useSwapConfirmation } from '../../state/swap/useSwapStreamEffect';
import { Skeleton } from '../shared/Skeleton';
import { SwapTransactionInfo } from './SwapTransactionInfo';
import { SwapRate } from './SwapRate';
import { useTranslation } from '../../hooks/translation';
import { FC } from 'react';
import BigNumber from 'bignumber.js';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';

const FiledContainerStyled = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    padding: 6px 12px;

    &:empty {
        display: none;
    }
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

const ToAmountField = styled.div`
    margin-left: auto;
    overflow: auto;

    cursor: default;

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

    > :last-child {
        margin-left: auto;
    }
`;

const SwapTokenSelectStyled = styled(SwapTokenSelect)`
    flex-shrink: 0;
`;

const Num2Tertiary = styled(Num2)`
    color: ${p => p.theme.textTertiary};
`;

export const SwapToField: FC<{ separateInfo?: boolean }> = ({ separateInfo }) => {
    const { t } = useTranslation();
    const [toAsset, setToAsset] = useSwapToAsset();
    const { confirmation, isFetching } = useSwapConfirmation();

    const toRelativeAmount = confirmation
        ? shiftedDecimals(new BigNumber(confirmation.askUnits), toAsset.decimals)
        : undefined;

    return (
        <>
            <FiledContainerStyled>
                <FiledHeader>
                    <Body3>{t('swap_receive')}</Body3>
                    <SwapToAmountBalance />
                </FiledHeader>
                <FieldBody>
                    <SwapTokenSelectStyled token={toAsset} onTokenChange={setToAsset} />
                    <ToAmountField>
                        {!confirmation && isFetching ? (
                            <Skeleton width="100px" height="28px" margin="4px 0" />
                        ) : toRelativeAmount ? (
                            <Num2>
                                {toRelativeAmount.decimalPlaces(toAsset.decimals).toString()}
                            </Num2>
                        ) : (
                            <Num2Tertiary>0</Num2Tertiary>
                        )}
                    </ToAmountField>
                </FieldBody>
                <FieldFooter>
                    <SwapRate />
                    <SwapAmountFiat amount={toRelativeAmount} asset={toAsset} />
                </FieldFooter>
                {!separateInfo && <SwapTransactionInfo />}
            </FiledContainerStyled>
            {separateInfo && (
                <FiledContainerStyled>
                    <SwapTransactionInfo />
                </FiledContainerStyled>
            )}
        </>
    );
};
