import BigNumber from 'bignumber.js';
import { FC, useMemo } from 'react';
import { styled } from 'styled-components';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../hooks/translation';
import { usePoolStakedBalance } from '../../state/staking/usePoolStakedBalance';
import { Body2 } from '../Text';

const EarningsWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const SectionTitle = styled(Body2)`
    color: ${p => p.theme.textPrimary};
    font-weight: 510;
    padding: 8px 0;
`;

const EarningsCard = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    overflow: hidden;
`;

const EarningRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    min-height: 36px;
    box-sizing: border-box;
`;

const RowDivider = styled.div`
    height: 0.5px;
    background: ${p => p.theme.separatorAlternate};
`;

const EarningLabel = styled(Body2)`
    color: ${p => p.theme.textSecondary};
    font-weight: 400;
`;

const EarningValue = styled(Body2)<{ $accent?: boolean }>`
    color: ${p => (p.$accent ? p.theme.accentGreen : p.theme.textPrimary)};
    font-weight: 500;
`;

export interface StakingEarningsInfoProps {
    pool: PoolInfo | undefined;
    amount: string;
}

export const StakingEarningsInfo: FC<StakingEarningsInfoProps> = ({ pool, amount }) => {
    const { t } = useTranslation();
    const { tonAmount } = usePoolStakedBalance(pool);
    const currentStakedTON = tonAmount ?? new BigNumber(0);

    const inputAmountBN = useMemo(() => {
        if (!amount) return new BigNumber(0);
        const bn = new BigNumber(amount);
        return bn.isNaN() ? new BigNumber(0) : bn;
    }, [amount]);

    const apy = pool?.apy ?? 0;
    const apyFraction = apy / 100;

    const afterStakeEarnings = useMemo(() => {
        return currentStakedTON.plus(inputAmountBN).multipliedBy(apyFraction);
    }, [currentStakedTON, inputAmountBN, apyFraction]);

    const currentEarnings = useMemo(() => {
        return currentStakedTON.multipliedBy(apyFraction);
    }, [currentStakedTON, apyFraction]);

    if (!pool) {
        return null;
    }

    const formatValue = (val: BigNumber) => t('staking_rewards_value', { value: val.toFixed(2) });

    return (
        <EarningsWrapper>
            <SectionTitle>{t('staking_earnings_section_title')}</SectionTitle>
            <EarningsCard>
                {currentEarnings.gt(0) && (
                    <>
                        <RowDivider />
                        <EarningRow>
                            <EarningLabel>{t('staking_rewards_current')}</EarningLabel>
                            <EarningValue>{formatValue(currentEarnings)}</EarningValue>{' '}
                        </EarningRow>
                    </>
                )}
                <EarningRow>
                    <EarningLabel>{t('staking_rewards_after_stake')}</EarningLabel>
                    {inputAmountBN.gt(0) && (
                        <EarningValue $accent>{formatValue(afterStakeEarnings)}</EarningValue>
                    )}
                </EarningRow>
            </EarningsCard>
        </EarningsWrapper>
    );
};
