import BigNumber from 'bignumber.js';
import { FC, useMemo } from 'react';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { PoolImplementationType, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { formatter, formatFiatCurrency } from '../../hooks/balance';
import { useRate, useFormatFiat } from '../../state/rates';
import { usePoolStakedBalance } from '../../state/staking/usePoolStakedBalance';
import { AmountField, ErrorText, BalanceLabel, MaxButton } from './AmountField';

export interface UnstakeAmountInputProps {
    amount: string;
    onChange: (value: string) => void;
    onMaxClick: () => void;
    pool: PoolInfo | undefined;
}

export const UnstakeAmountInput: FC<UnstakeAmountInputProps> = ({
    amount,
    onChange,
    onMaxClick,
    pool
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const { tonAmount } = usePoolStakedBalance(pool);

    const isTfPool = pool?.implementation === PoolImplementationType.Tf;

    const amountBN = useMemo(() => {
        if (!amount) return undefined;
        const bn = new BigNumber(amount);
        return bn.isNaN() ? undefined : bn;
    }, [amount]);

    const { fiatAmount } = useFormatFiat(tonRate, amountBN);

    const isInsufficient = useMemo(() => {
        if (!amountBN || !tonAmount) return false;
        return amountBN.gt(tonAmount);
    }, [amountBN, tonAmount]);

    const fiatDisplay = useMemo(() => {
        const formatted = fiatAmount ? fiatAmount : formatFiatCurrency(fiat, 0);
        return `≈${formatted}`;
    }, [fiatAmount, fiat]);

    const unstakableDisplay = useMemo(() => {
        if (!tonAmount) return '0';
        return formatter.formatDisplay(tonAmount);
    }, [tonAmount]);

    return (
        <AmountField
            amount={amount}
            onChange={onChange}
            fiatDisplay={fiatDisplay}
            disabled={isTfPool}
            footer={
                isInsufficient ? (
                    <>
                        <ErrorText>{t('staking_insufficient_balance')}</ErrorText>
                        <MaxButton onClick={onMaxClick}>{t('staking_max')}</MaxButton>
                    </>
                ) : isTfPool ? (
                    <BalanceLabel>{t('staking_tf_full_withdrawal_only')}</BalanceLabel>
                ) : (
                    <>
                        <BalanceLabel>
                            {t('staking_available_label')}: {unstakableDisplay}
                        </BalanceLabel>
                        <MaxButton onClick={onMaxClick}>{t('staking_max')}</MaxButton>
                    </>
                )
            }
        />
    );
};
