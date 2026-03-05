import BigNumber from 'bignumber.js';
import { FC, useMemo } from 'react';
import { styled } from 'styled-components';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { formatDisplayAmount } from '../../libs/formatDisplayAmount';
import { useRate, useFormatFiat } from '../../state/rates';
import { useTonBalance } from '../../state/wallet';
import { Body2, Body2Class, Body3 } from '../Text';

const FieldContainer = styled.div`
    flex: 1;
    min-width: 0;
`;

const InputBorderedBox = styled.label`
    background: ${p => p.theme.fieldBackground};
    border: 1px solid ${p => p.theme.fieldBackground};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    transition: border-color 0.15s ease-in-out;
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 52px;
    box-sizing: border-box;
    gap: 8px;
    cursor: text;

    &:focus-within {
        border-color: ${p => p.theme.fieldActiveBorder};
    }
`;

const InputLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
`;

const FieldFooter = styled.div`
    display: flex;
    align-items: center;
    padding: 4px 12px;
    min-height: 20px;
    gap: 4px;
`;

const AmountInputStyled = styled.input<{ $isErrored: boolean; $width: number }>`
    border: none;
    background: none;
    text-align: left;
    outline: none;
    color: ${p => (p.$isErrored ? p.theme.accentRed : p.theme.textPrimary)};
    font-family: inherit;
    min-width: 1ch;
    width: ${p => p.$width}ch;

    ${Body2Class}

    &::placeholder {
        color: ${p => p.theme.textTertiary};
    }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    -moz-appearance: textfield;
`;

const TokenLabel = styled.span`
    font-size: 14px;
    color: ${p => p.theme.textSecondary};
    flex-shrink: 0;
`;

const FiatAmount = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    text-align: right;
    flex-shrink: 0;
    white-space: nowrap;
`;

const ErrorText = styled(Body3)`
    color: ${p => p.theme.accentRed};
`;

const BalanceLabel = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const MaxButton = styled.button`
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
    color: ${p => p.theme.accentBlue};
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;
`;

export interface StakingAmountInputProps {
    amount: string;
    onChange: (value: string) => void;
}

export const GAS_RESERVE_TON = 1;

export const StakingAmountInput: FC<StakingAmountInputProps> = ({ amount, onChange }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { data: balance } = useTonBalance();
    const { data: rate } = useRate(CryptoCurrency.TON);

    const amountBN = useMemo(() => {
        if (!amount) return undefined;
        const bn = new BigNumber(amount);
        return bn.isNaN() ? undefined : bn;
    }, [amount]);

    const { fiatAmount } = useFormatFiat(rate, amountBN);

    const balanceTON = useMemo(() => {
        if (!balance) return undefined;
        return balance.relativeAmount;
    }, [balance]);

    const maxAmount = useMemo(() => {
        if (!balanceTON) return undefined;
        const max = balanceTON.minus(GAS_RESERVE_TON);
        return max.gt(0) ? max : new BigNumber(0);
    }, [balanceTON]);

    const isInsufficient = useMemo(() => {
        if (!amountBN || !maxAmount) return false;
        return amountBN.gt(maxAmount);
    }, [amountBN, maxAmount]);

    const onMaxClick = () => {
        if (maxAmount !== undefined) {
            onChange(maxAmount.toFixed(9, BigNumber.ROUND_DOWN));
        }
    };

    const fiatDisplay = useMemo(() => {
        const formatted = fiatAmount
            ? fiatAmount
            : formatDisplayAmount({
                  kind: 'fiat',
                  amount: 0,
                  currency: fiat,
                  profile: 'default'
              });
        return `≈${formatted}`;
    }, [fiatAmount, fiat]);

    const balanceDisplay = useMemo(() => {
        if (!balanceTON) {
            return '0';
        }

        return formatDisplayAmount({
            kind: 'token',
            amount: balanceTON,
            unit: 'TON',
            withUnit: false
        });
    }, [balanceTON]);

    return (
        <FieldContainer>
            <InputBorderedBox>
                <InputLeft>
                    <AmountInputStyled
                        type="number"
                        min="0"
                        step="any"
                        value={amount}
                        onChange={e => onChange(e.target.value)}
                        placeholder="0"
                        inputMode="decimal"
                        $isErrored={isInsufficient}
                        $width={Math.max(1, (amount || '0').length)}
                    />
                    <TokenLabel>TON</TokenLabel>
                </InputLeft>
                <FiatAmount>{fiatDisplay}</FiatAmount>
            </InputBorderedBox>
            <FieldFooter>
                {isInsufficient ? (
                    <ErrorText>{t('staking_insufficient_balance')}</ErrorText>
                ) : (
                    <>
                        <BalanceLabel>
                            {t('staking_balance_label')}: {balanceDisplay}
                        </BalanceLabel>
                        <MaxButton onClick={onMaxClick}>{t('staking_max')}</MaxButton>
                    </>
                )}
            </FieldFooter>
        </FieldContainer>
    );
};
