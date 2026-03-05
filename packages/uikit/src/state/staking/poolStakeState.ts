import BigNumber from 'bignumber.js';
import { AccountStakingInfo } from '@tonkeeper/core/dist/tonApiV2';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';

export interface StakingPoolLiquidTokenBalance {
    weiAmount: BigNumber;
    relativeAmount: BigNumber;
    price?: BigNumber;
}

interface ResolvePoolStakeStateParams {
    position?: AccountStakingInfo;
    liquidTokenBalance?: StakingPoolLiquidTokenBalance;
    tonPrice?: BigNumber;
}

export const hasStakingPositionActivity = (position?: AccountStakingInfo) => {
    return (
        (position?.amount ?? 0) > 0 ||
        (position?.pendingDeposit ?? 0) > 0 ||
        (position?.pendingWithdraw ?? 0) > 0 ||
        (position?.readyWithdraw ?? 0) > 0
    );
};

export const hasLiquidStakingTokenActivity = (
    liquidTokenBalance?: StakingPoolLiquidTokenBalance
) => {
    return liquidTokenBalance?.weiAmount.gt(0) ?? false;
};

export const getLiquidStakingTonAmount = (
    liquidTokenBalance: StakingPoolLiquidTokenBalance,
    tonPrice?: BigNumber
) => {
    if (liquidTokenBalance.price && tonPrice && !tonPrice.isZero()) {
        return liquidTokenBalance.relativeAmount
            .multipliedBy(liquidTokenBalance.price)
            .div(tonPrice);
    }

    return liquidTokenBalance.relativeAmount;
};

export const hasActiveStakeForPool = ({
    position,
    liquidTokenBalance
}: Pick<ResolvePoolStakeStateParams, 'position' | 'liquidTokenBalance'>) => {
    return (
        hasStakingPositionActivity(position) || hasLiquidStakingTokenActivity(liquidTokenBalance)
    );
};

export const getStakingPoolTonAmount = ({
    position,
    liquidTokenBalance,
    tonPrice
}: ResolvePoolStakeStateParams) => {
    const stakedAmount = position?.amount ?? 0;
    if (stakedAmount > 0) {
        return shiftedDecimals(stakedAmount);
    }

    if (liquidTokenBalance && hasLiquidStakingTokenActivity(liquidTokenBalance)) {
        return getLiquidStakingTonAmount(liquidTokenBalance, tonPrice);
    }

    return shiftedDecimals(stakedAmount);
};
