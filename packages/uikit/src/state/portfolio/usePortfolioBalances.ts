import { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { Address } from '@ton/core';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { AccountStakingInfo, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { TON_ASSET, TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { allChainsAssetsKeys, useAllChainsAssetsWithPrice } from '../home';
import { useRate } from '../rates';
import { useStakedPoolsWithInfo } from '../staking/usePoolInfo';
import { useStakingPools } from '../staking/useStakingPools';
import { useStakingPositions } from '../staking/useStakingPosition';
import { hasStakingPositionActivity } from '../staking/poolStakeState';
import { QueryKey } from '../../libs/queryKey';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../tonendpoint';

export interface PortfolioTokenBalance {
    kind: 'token';
    assetAmount: AssetAmount;
    price?: BigNumber;
    isPinned?: boolean;
    stakingPool?: PoolInfo;
}

export interface PortfolioStakingPosition {
    kind: 'staking-position';
    pool: PoolInfo;
    position: AccountStakingInfo;
}

export type PortfolioBalance = PortfolioTokenBalance | PortfolioStakingPosition;

export interface PortfolioBalancesData {
    tokenBalances: PortfolioTokenBalance[];
    stakingPositions: PortfolioStakingPosition[];
    balancesForList: PortfolioBalance[];
}

export const portfolioBalancesKeys = [...allChainsAssetsKeys, QueryKey.staking];

export const getPortfolioBalanceId = (balance: PortfolioBalance) => {
    if (balance.kind === 'token') {
        return `token:${balance.assetAmount.asset.id}`;
    }
    return `staking:${balance.pool.address}`;
};

const getLastPinnedIndex = (tokenBalances: PortfolioTokenBalance[]) => {
    for (let i = tokenBalances.length - 1; i >= 0; i -= 1) {
        if (tokenBalances[i].isPinned) {
            return i;
        }
    }

    return -1;
};

const getStakingBalanceNominal = (
    balance: PortfolioTokenBalance | PortfolioStakingPosition,
    tonPrice: BigNumber | undefined
) => {
    if (balance.kind === 'token') {
        return balance.price
            ? balance.assetAmount.relativeAmount.multipliedBy(balance.price)
            : new BigNumber(0);
    }

    return tonPrice
        ? shiftedDecimals(balance.position.amount).multipliedBy(tonPrice)
        : new BigNumber(0);
};

const compareStakingBalancesByNominal = (
    a: PortfolioTokenBalance | PortfolioStakingPosition,
    b: PortfolioTokenBalance | PortfolioStakingPosition,
    tonPrice: BigNumber | undefined
) => {
    const aValue = getStakingBalanceNominal(a, tonPrice);
    const bValue = getStakingBalanceNominal(b, tonPrice);
    const byNominalDesc = bValue.comparedTo(aValue);

    if (byNominalDesc !== 0) {
        return byNominalDesc;
    }

    return getPortfolioBalanceId(a).localeCompare(getPortfolioBalanceId(b));
};

export const usePortfolioBalances = () => {
    const allAssetsQuery = useAllChainsAssetsWithPrice();
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const isStakingEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.STAKING);
    const stakingPoolsQuery = useStakingPools();
    const stakingPositionsQuery = useStakingPositions();
    const stakedPoolsWithInfoQuery = useStakedPoolsWithInfo();

    const data = useMemo<PortfolioBalancesData | undefined>(() => {
        const allAssets = allAssetsQuery.assets;
        const pools = isStakingEnabled ? stakingPoolsQuery.data ?? [] : [];
        const positions = isStakingEnabled ? stakingPositionsQuery.data ?? [] : [];

        if (!allAssets) {
            return undefined;
        }
        const tonPrice = tonRate?.prices !== undefined ? new BigNumber(tonRate.prices) : undefined;

        const findPoolByPositionAddress = (poolAddress: string): PoolInfo | undefined => {
            return (
                pools.find(pool => eqAddresses(pool.address, poolAddress)) ??
                stakedPoolsWithInfoQuery.data?.find(item =>
                    eqAddresses(item.pool.address, poolAddress)
                )?.pool
            );
        };

        const tokenBalances: PortfolioTokenBalance[] = allAssets.map(asset => {
            const tonAsset = asset.assetAmount.asset;
            let stakingPool: PoolInfo | undefined;

            if (isTonAsset(tonAsset) && Address.isAddress(tonAsset.address)) {
                stakingPool = pools.find(
                    pool =>
                        pool.liquidJettonMaster &&
                        eqAddresses(pool.liquidJettonMaster, tonAsset.address)
                );
            }

            return {
                kind: 'token',
                assetAmount: asset.assetAmount,
                price: asset.price,
                isPinned: asset.isPinned,
                stakingPool
            };
        });

        const stakingPositions: PortfolioStakingPosition[] = positions
            .filter(hasStakingPositionActivity)
            .map(position => {
                const pool = findPoolByPositionAddress(position.pool);
                if (!pool) {
                    console.warn('Staking position pool not found:', position.pool);
                    return undefined;
                }
                return {
                    kind: 'staking-position' as const,
                    pool,
                    position
                };
            })
            .filter((position): position is PortfolioStakingPosition => !!position);

        const nonLiquidStakingPositions = stakingPositions.filter(position => {
            return !position.pool.liquidJettonMaster;
        });

        const stakingTokenBalances = tokenBalances.filter(balance => !!balance.stakingPool);
        const regularTokenBalances = tokenBalances.filter(balance => !balance.stakingPool);

        const tonIndex = regularTokenBalances.findIndex(
            balance => balance.assetAmount.asset.id === TON_ASSET.id
        );
        const lastPinnedIndex = getLastPinnedIndex(regularTokenBalances);
        const tronUsdtIndex = regularTokenBalances.findIndex(
            balance => balance.assetAmount.asset.id === TRON_USDT_ASSET.id
        );
        const insertionAfterIndex = Math.max(tonIndex, lastPinnedIndex, tronUsdtIndex);
        const insertionIndex = insertionAfterIndex >= 0 ? insertionAfterIndex + 1 : 0;

        const stakingBalancesForList: PortfolioBalance[] = [
            ...stakingTokenBalances,
            ...nonLiquidStakingPositions
        ].sort((a, b) => compareStakingBalancesByNominal(a, b, tonPrice));

        const balancesForList = [
            ...regularTokenBalances.slice(0, insertionIndex),
            ...stakingBalancesForList,
            ...regularTokenBalances.slice(insertionIndex)
        ];

        return {
            tokenBalances,
            stakingPositions,
            balancesForList
        };
    }, [
        allAssetsQuery.assets,
        tonRate?.prices,
        isStakingEnabled,
        stakingPoolsQuery.data,
        stakingPositionsQuery.data,
        stakedPoolsWithInfoQuery.data
    ]);

    const tokenError = allAssetsQuery.error;

    const poolsReady =
        !isStakingEnabled || stakingPoolsQuery.data !== undefined || !!stakingPoolsQuery.error;
    const positionsReady =
        !isStakingEnabled ||
        stakingPositionsQuery.data !== undefined ||
        !!stakingPositionsQuery.error;
    const isStakingReady = poolsReady && positionsReady;

    const positionsCount = stakingPositionsQuery.data?.length ?? 0;
    const isStakedPoolsWithInfoLoading =
        isStakingEnabled && positionsCount > 0 && stakedPoolsWithInfoQuery.isLoading;
    const isStakingLoading = !isStakingReady || isStakedPoolsWithInfoLoading;
    const isLoading = allAssetsQuery.assets === undefined && !tokenError;

    return {
        data,
        tokenError,
        isLoading,
        isStakingLoading,
        isStakingReady
    };
};

export const usePortfolioBalancesForList = () => {
    const portfolio = usePortfolioBalances();
    return { ...portfolio, data: portfolio.data?.balancesForList };
};
