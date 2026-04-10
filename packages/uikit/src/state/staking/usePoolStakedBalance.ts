import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { AccountStakingInfo, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { useRate } from '../rates';
import { useJettonBalance } from '../jetton';
import { useStakingPosition } from './useStakingPosition';
import {
    getLiquidStakingTonAmount,
    hasLiquidStakingTokenActivity,
    StakingPoolLiquidTokenBalance
} from './poolStakeState';

export interface PoolStakedBalance {
    tonAmount: BigNumber | undefined;
    isLoading: boolean;
    isLiquid: boolean;
    position: AccountStakingInfo | undefined;
    liquidTokenBalance: StakingPoolLiquidTokenBalance | undefined;
    tonPrice: BigNumber | undefined;
}

export const usePoolStakedBalance = (pool: PoolInfo | undefined): PoolStakedBalance => {
    const isLiquid = !!pool?.liquidJettonMaster;

    const { data: position, isLoading: isPositionLoading } = useStakingPosition(pool?.address);

    const { data: jettonBalance, isLoading: isJettonLoading } = useJettonBalance(
        isLiquid ? pool?.liquidJettonMaster : undefined
    );

    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const { data: jettonRate } = useRate(pool?.liquidJettonMaster ?? CryptoCurrency.TON);

    const tonPrice = useMemo(() => {
        return tonRate?.prices !== undefined ? new BigNumber(tonRate.prices) : undefined;
    }, [tonRate?.prices]);

    const liquidTokenBalance = useMemo<StakingPoolLiquidTokenBalance | undefined>(() => {
        if (!isLiquid || !jettonBalance) return undefined;

        const decimals = jettonBalance.jetton?.decimals ?? 9;
        const relativeAmount = new BigNumber(jettonBalance.balance).shiftedBy(-decimals);

        return {
            weiAmount: new BigNumber(jettonBalance.balance),
            relativeAmount,
            price: jettonRate?.prices !== undefined ? new BigNumber(jettonRate.prices) : undefined
        };
    }, [isLiquid, jettonBalance, jettonRate?.prices]);

    const tonAmount = useMemo((): BigNumber | undefined => {
        if (isLiquid) {
            if (!liquidTokenBalance || !hasLiquidStakingTokenActivity(liquidTokenBalance)) {
                return undefined;
            }
            if (!liquidTokenBalance.price || !tonPrice || tonPrice.isZero()) {
                return undefined;
            }
            return getLiquidStakingTonAmount(liquidTokenBalance, tonPrice);
        }

        if (position) {
            return shiftedDecimals(position.amount);
        }
        return undefined;
    }, [isLiquid, liquidTokenBalance, tonPrice, position]);

    const isLoading = isLiquid ? isJettonLoading : isPositionLoading;

    return {
        tonAmount,
        isLoading,
        isLiquid,
        position,
        liquidTokenBalance,
        tonPrice
    };
};
