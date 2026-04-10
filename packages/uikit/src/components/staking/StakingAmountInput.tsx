import BigNumber from 'bignumber.js';
import { FC, useMemo } from 'react';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { STAKE_GAS_RESERVE_TON } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/staking-encoder';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { formatter, formatFiatCurrency } from '../../hooks/balance';
import { useRate, useFormatFiat } from '../../state/rates';
import { useTonBalance } from '../../state/wallet';
import { AmountField, ErrorText, BalanceLabel, MaxButton } from './AmountField';

export interface StakingAmountInputProps {
    amount: string;
    onChange: (value: string) => void;
}

export const GAS_RESERVE_TON = STAKE_GAS_RESERVE_TON;

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
        const formatted = fiatAmount ? fiatAmount : formatFiatCurrency(fiat, 0);
        return `≈${formatted}`;
    }, [fiatAmount, fiat]);

    const balanceDisplay = useMemo(() => {
        if (!balanceTON) return '0';
        return formatter.formatDisplay(balanceTON);
    }, [balanceTON]);

    return (
        <AmountField
            amount={amount}
            onChange={onChange}
            fiatDisplay={fiatDisplay}
            footer={
                <>
                    {isInsufficient ? (
                        <ErrorText>{t('staking_insufficient_balance')}</ErrorText>
                    ) : (
                        <BalanceLabel>
                            {t('staking_balance_label')}: {balanceDisplay}
                        </BalanceLabel>
                    )}
                    <MaxButton onClick={onMaxClick}>{t('staking_max')}</MaxButton>
                </>
            }
        />
    );
};
