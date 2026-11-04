import { FC, useMemo } from 'react';
import BigNumber from 'bignumber.js';

import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { JettonBalance, PoolInfo } from '@tonkeeper/core/dist/tonApiV2';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';

import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';
import { useAppContext } from '../../../../hooks/appContext';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../../libs/routes';
import { useJettonRawList } from '../../../../state/jetton';
import { toTokenRate, useRate } from '../../../../state/rates';
import { useStakedPoolsWithInfo } from '../../../../state/staking/usePoolInfo';
import { useStakingPools } from '../../../../state/staking/useStakingPools';
import { useStakingPositions } from '../../../../state/staking/useStakingPosition';
import { hasStakingPositionActivity } from '../../../../state/staking/poolStakeState';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../../../state/tonendpoint';
import { StakingPositionIcon } from './staking-shared';
import { TokenCell } from '../TokenCell';

/** A pool the wallet holds an active stake in, with the value to display. */
export interface HomeStakedRow {
    pool: PoolInfo;
    tonAmount: BigNumber | undefined;
    fiatAmount: BigNumber | undefined;
}

const liquidStakeTonAmount = (
    balance: JettonBalance,
    fiat: FiatCurrencies,
    tonPrice: BigNumber | undefined
): BigNumber | undefined => {
    const jettonPrice = balance.price ? toTokenRate(balance.price, fiat).prices : undefined;
    if (jettonPrice === undefined || !tonPrice || tonPrice.isZero()) return undefined;

    const decimals = balance.jetton?.decimals ?? 9;
    return new BigNumber(balance.balance)
        .shiftedBy(-decimals)
        .multipliedBy(jettonPrice)
        .div(tonPrice);
};

/**
 * Every "Staked" row the home portfolio will render, resolved in one place.
 *
 * The rows have to be known before the list is laid out: they share the
 * collapsed list's row budget with the token rows, and the portfolio's
 * loading state can only reserve their slots if their count is settled
 * before the skeleton lifts. Resolving each row from inside itself — the
 * shape the rest of the staking screens use — makes both impossible, as
 * rows then appear one by one after the portfolio has already rendered.
 *
 * Every source here is therefore a whole-wallet query: the nominator
 * positions cover the solid pools, and the jetton list covers the liquid
 * ones, whose stake lives in the wallet's balance of the pool's jetton
 * rather than in a reported position.
 */
export const useHomeStakedRows = (): {
    rows: HomeStakedRow[];
    isLoading: boolean;
    hasReportedStake: boolean;
} => {
    const { fiat } = useAppContext();
    const stakingEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.STAKING);

    const pools = useStakingPools();
    const positions = useStakingPositions();
    const stakedWithInfo = useStakedPoolsWithInfo();
    const jettons = useJettonRawList();
    const { data: tonRate } = useRate(CryptoCurrency.TON);

    const tonPrice = useMemo(
        () => (tonRate?.prices !== undefined ? new BigNumber(tonRate.prices) : undefined),
        [tonRate?.prices]
    );

    const rows = useMemo<HomeStakedRow[]>(() => {
        const resolved: HomeStakedRow[] = [];
        const push = (pool: PoolInfo, tonAmount: BigNumber | undefined) => {
            if (resolved.some(row => eqAddresses(row.pool.address, pool.address))) return;
            resolved.push({
                pool,
                tonAmount,
                fiatAmount: tonAmount && tonPrice ? tonAmount.multipliedBy(tonPrice) : undefined
            });
        };

        stakedWithInfo.data?.forEach(({ pool, position }) => {
            if (pool.liquidJettonMaster) return;
            if (!hasStakingPositionActivity(position)) return;
            push(pool, shiftedDecimals(position.amount));
        });

        pools.data
            ?.filter(pool => !!pool.liquidJettonMaster)
            .forEach(pool => {
                const balance = jettons.data?.balances.find(item =>
                    eqAddresses(item.jetton.address, pool.liquidJettonMaster!)
                );
                if (!balance || !new BigNumber(balance.balance).gt(0)) return;
                push(pool, liquidStakeTonAmount(balance, fiat, tonPrice));
            });

        return resolved;
    }, [stakedWithInfo.data, pools.data, jettons.data, fiat, tonPrice]);

    // A query that failed counts as settled: the portfolio must not stay
    // masked forever because staking is unreachable.
    const settled = (query: { data: unknown; isError: boolean }) =>
        query.data !== undefined || query.isError;

    const isLoading =
        stakingEnabled &&
        !(
            settled(pools) &&
            settled(positions) &&
            (!positions.data?.length || settled(stakedWithInfo)) &&
            settled(jettons)
        );

    return {
        rows,
        isLoading,
        // Nominators show up here before a HomeStakedRow is built (and liquid
        // stakes often never do). The portfolio empty-state must not treat a
        // wallet with a reported position as having no assets.
        hasReportedStake: (stakedWithInfo.data?.length ?? 0) > 0
    };
};

/**
 * "Staked" row in the home portfolio list: TON icon with the provider
 * badge, the pool name, and the staked TON value.
 */
export const HomeMultichainStakedRow: FC<{ row: HomeStakedRow }> = ({ row }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const navigate = useNavigate();

    return (
        <TokenCell
            onClick={() =>
                navigate(`${MultichainRoute.staking}/${encodeURIComponent(row.pool.address)}`)
            }
            icon={<StakingPositionIcon pool={row.pool} className="size-11" />}
            title={t('staking_staked')}
            subtitle={row.pool.name}
            rightPrimary={row.tonAmount ? formatAmount(row.tonAmount) : '—'}
            rightSecondary={row.fiatAmount && formatFiatCurrency(fiat, row.fiatAmount)}
        />
    );
};
