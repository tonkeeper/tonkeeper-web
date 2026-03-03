import BigNumber from 'bignumber.js';
import { FC } from 'react';
import { styled } from 'styled-components';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../hooks/translation';
import { Body2, Body3 } from '../Text';
import { StakingPoolIcon } from './StakingPoolIcon';

const PoolCard = styled.div`
    background: ${p => p.theme.backgroundContent};
    border-radius: ${p =>
        p.theme.displayType === 'full-width' ? p.theme.corner2xSmall : p.theme.cornerSmall};
    padding: 8px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
`;

const PoolTextWrapper = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

const PoolName = styled(Body2)`
    color: ${p => p.theme.textPrimary};
    font-weight: 510;
`;

const PoolDetail = styled(Body3)`
    color: ${p => p.theme.textSecondary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export interface StakingPoolSelectorProps {
    pool: PoolInfo | undefined;
}

export const StakingPoolSelector: FC<StakingPoolSelectorProps> = ({ pool }) => {
    const { t } = useTranslation();

    if (!pool) {
        return null;
    }

    const apyStr = pool.apy.toFixed(2);
    const minStakeTON = shiftedDecimals(new BigNumber(pool.minStake)).toFixed(0);

    return (
        <PoolCard>
            <StakingPoolIcon pool={pool} size={24} variant="provider" />
            <PoolTextWrapper>
                <PoolName>{pool.name}</PoolName>
                <PoolDetail>
                    {t('staking_pool_detail', { apy: apyStr, minDeposit: minStakeTON })}
                </PoolDetail>
            </PoolTextWrapper>
        </PoolCard>
    );
};
