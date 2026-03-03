import BigNumber from 'bignumber.js';
import { FC } from 'react';
import { styled } from 'styled-components';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { useTranslation } from '../../hooks/translation';
import { useJettonInfo } from '../../state/jetton';
import { Body2, Body3 } from '../Text';

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

const PoolIcon = styled.img`
    width: 24px;
    height: 24px;
    border-radius: 12px;
    flex-shrink: 0;
`;

const PoolIconFallback = styled.div`
    width: 24px;
    height: 24px;
    border-radius: 12px;
    flex-shrink: 0;
    background: ${p => p.theme.backgroundContentTint};
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
    const { data: jettonInfo } = useJettonInfo(pool?.liquidJettonMaster ?? '');
    const iconUrl = jettonInfo?.metadata?.image ?? jettonInfo?.preview;

    if (!pool) {
        return null;
    }

    const apyStr = pool.apy.toFixed(2);
    const minStakeTON = shiftedDecimals(new BigNumber(pool.minStake)).toFixed(0);

    return (
        <PoolCard>
            {iconUrl ? (
                <PoolIcon src={iconUrl} alt={pool.name} />
            ) : (
                <PoolIconFallback />
            )}
            <PoolTextWrapper>
                <PoolName>{pool.name}</PoolName>
                <PoolDetail>
                    {t('staking_pool_detail', { apy: apyStr, minDeposit: minStakeTON })}
                </PoolDetail>
            </PoolTextWrapper>
        </PoolCard>
    );
};
