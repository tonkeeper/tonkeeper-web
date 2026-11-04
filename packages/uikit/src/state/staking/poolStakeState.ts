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

/**
 * Pool-token wei to burn for a TON-denominated unstake. Rounded down and
 * clamped to the actual jetton balance — the rate is a market quote, so
 * an unclamped conversion can exceed what the wallet holds and the burn
 * would bounce. A missing or zero rate throws instead of dividing: the
 * caller must not silently burn a garbage amount.
 */
export const convertTonToPoolTokenNano = (
    tonAmount: BigNumber,
    liquidTokenBalance: StakingPoolLiquidTokenBalance,
    tonPrice: BigNumber
): bigint => {
    if (!liquidTokenBalance.price || liquidTokenBalance.price.lte(0) || tonPrice.lte(0)) {
        throw new Error('Liquid jetton rate not found');
    }
    const tokenAmount = tonAmount.multipliedBy(tonPrice).div(liquidTokenBalance.price);
    const converted = new BigNumber(tokenAmount.shiftedBy(9).toFixed(0, BigNumber.ROUND_DOWN));
    return BigInt(BigNumber.min(converted, liquidTokenBalance.weiAmount).toFixed(0));
};

export const getStakingPoolTonAmount = ({
    position,
    liquidTokenBalance,
    tonPrice
}: ResolvePoolStakeStateParams) => {
    if (liquidTokenBalance && hasLiquidStakingTokenActivity(liquidTokenBalance)) {
        return getLiquidStakingTonAmount(liquidTokenBalance, tonPrice);
    }

    const stakedAmount = position?.amount ?? 0;
    return shiftedDecimals(stakedAmount);
};
