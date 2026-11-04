import { useMemo } from 'react';
import { useQueries, UseQueryOptions } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import {
    Account,
    AccountMultichain,
    getNetworkByAccount
} from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { DashboardCellNumeric } from '@tonkeeper/core/dist/entries/dashboard';
import { getDashboardData } from '@tonkeeper/core/dist/service/proService';
import {
    getOwnMultichainWalletAssets,
    multichainOwnedAccountTypes,
    multichainOwnedAccountTypesForTonVersions
} from '@tonkeeper/core/dist/service/multichainWalletService';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import {
    MultichainApiWalletCredentials,
    multichainApiWalletCredentials
} from '@tonkeeper/core/dist/service/chainkit/walletAuthService';

import { formatFiatCurrency } from '../../../../hooks/balance';
import { useAppSdk } from '../../../../hooks/appSdk';
import { QueryKey } from '../../../../libs/queryKey';
import { useUserFiat } from '../../../../state/fiat';
import { useAccountsSafeModeEnabled } from '../../../../state/multichain/useSafeMode';
import { useDustFilters } from '../../../../state/multichain/useDustFilters';
import {
    applyLocalAssetFilters,
    fetchMultichainWalletAssets,
    multichainWalletAssetsQueryKey,
    MultichainWalletAssetsData
} from '../../../../state/multichain/useMultichainWalletAssets';
import {
    AssetVisibilityMap,
    pendingAssetVisibilityQuery
} from '../../../../state/multichain/useMultichainAssetVisibility';

/** iOS' MultichainPortfolioLoader freshness window. */
const FRESHNESS_MS = 60_000;

const TOTAL_BALANCE_COLUMN = 'total_balance';

/**
 * Where a row's fiat total comes from. Accounts with no source at all —
 * multisigs, testnet, a multichain account whose stored wallet id
 * predates format 2 — render a dash instead.
 */
const totalSource = (
    account: Account
):
    | {
          kind: 'multichain';
          credentials: MultichainApiWalletCredentials;
          account: AccountMultichain;
      }
    | { kind: 'ton'; address: string }
    | undefined => {
    if (account.type === 'ton-multisig') {
        return undefined;
    }
    if (account.type === 'multichain') {
        const credentials = multichainApiWalletCredentials(account);
        return credentials ? { kind: 'multichain', credentials, account } : undefined;
    }
    // The dashboard column is mainnet-only.
    return getNetworkByAccount(account) === Network.MAINNET
        ? { kind: 'ton', address: account.activeTonWallet.rawAddress }
        : undefined;
};

const fetchTonTotal = async (
    address: string,
    fiat: FiatCurrencies,
    sdk: IAppSdk
): Promise<BigNumber | null> => {
    const rows = await getDashboardData(
        { accounts: [address], columns: [TOTAL_BALANCE_COLUMN] },
        { currency: fiat, token: await sdk.subscriptionService.getToken() }
    );

    const cell = rows[0]?.cells[0] as DashboardCellNumeric | undefined;
    if (cell === undefined) {
        return null;
    }
    const total = new BigNumber(cell.value);
    return total.isFinite() ? total : null;
};

type FiatTotalSource = MultichainWalletAssetsData | BigNumber | null;

/**
 * A multichain account reads the same portfolio cache entry as its home
 * screen — same request, same refetch cadence, same invalidations — so the
 * switcher row and the balance header never disagree. A TON account has no
 * such entry and fetches its dashboard total on its own.
 */
const accountFiatTotalQuery = (
    account: Account,
    fiat: FiatCurrencies,
    storage: IStorage,
    sdk: IAppSdk,
    safeModeEnabled: boolean | undefined,
    hideDust: boolean | undefined
): UseQueryOptions<FiatTotalSource> => {
    const source = totalSource(account);
    const enabled = source !== undefined && safeModeEnabled !== undefined && hideDust !== undefined;

    if (source?.kind === 'multichain') {
        return {
            queryKey: multichainWalletAssetsQueryKey(
                source.credentials.walletId,
                source.account.activeTonWallet.id,
                fiat,
                safeModeEnabled,
                hideDust
            ),
            queryFn: (): Promise<FiatTotalSource> =>
                fetchMultichainWalletAssets(
                    storage,
                    source.credentials,
                    multichainOwnedAccountTypes(source.account),
                    fiat,
                    safeModeEnabled === true,
                    hideDust === true
                ),
            enabled,
            keepPreviousData: true,
            retry: false
        };
    }

    return {
        queryKey: [QueryKey.walletsListFiatTotals, account.id, fiat, safeModeEnabled, hideDust],
        queryFn: (): Promise<FiatTotalSource> =>
            source ? fetchTonTotal(source.address, fiat, sdk) : Promise.resolve(null),
        enabled,
        staleTime: FRESHNESS_MS,
        keepPreviousData: true,
        retry: false
    };
};

const resolveTotal = (
    data: FiatTotalSource | undefined,
    pendingVisibility: AssetVisibilityMap | undefined,
    safeModeEnabled: boolean | undefined
): BigNumber | null | undefined => {
    if (data === undefined || data === null || BigNumber.isBigNumber(data)) {
        return data;
    }
    return applyLocalAssetFilters(data, pendingVisibility ?? {}, safeModeEnabled).totalFiat;
};

export type AccountsFiatTotals = {
    /** Per account, in order: the total, `null` when there is none to show, `undefined` while loading. */
    totals: (BigNumber | null | undefined)[];
    /** Sum of every total that has loaded so far. */
    sum: BigNumber;
    /** True until every account that has a total source has answered or failed. */
    isLoading: boolean;
    /** True when every account with a total source failed and nothing loaded. */
    isError: boolean;
    refetch: () => void;
};

/**
 * Each account's total fiat value — the caption both native apps put under
 * a wallet's name in their switcher.
 *
 * One query per account, as on iOS and Android, so rows fill in
 * independently and a wallet the backend can't answer for doesn't blank the
 * rest: multichain accounts read the multichain backend's whole-wallet
 * `fiat_price` (iOS' MultichainPortfolioStore) through the home screen's
 * portfolio entry, TON accounts the dashboard `total_balance` column for
 * their active wallet. Pending visibility choices and the safe-mode net are
 * applied exactly as the home screen applies them.
 */
export const useAccountsFiatTotals = (accounts: Account[]): AccountsFiatTotals => {
    const fiat = useUserFiat();
    const sdk = useAppSdk();
    const safeModeEnabled = useAccountsSafeModeEnabled(accounts);
    const { data: dustFilters } = useDustFilters();

    const queries = accounts.map((account, index) =>
        accountFiatTotalQuery(
            account,
            fiat,
            sdk.storage,
            sdk,
            safeModeEnabled[index],
            dustFilters?.hideDustBalances
        )
    );
    const results = useQueries({ queries });
    const pendingVisibility = useQueries({
        queries: accounts.map(account => pendingAssetVisibilityQuery(sdk.storage, account))
    });

    const sourced = accounts.map(account => totalSource(account) !== undefined);
    const totals = results.map((result, index) =>
        sourced[index]
            ? resolveTotal(result.data, pendingVisibility[index].data, safeModeEnabled[index])
            : null
    );
    const sum = totals.reduce<BigNumber>(
        (acc, total) => (total ? acc.plus(total) : acc),
        new BigNumber(0)
    );
    const pending = results.filter(
        (result, index) => sourced[index] && result.data === undefined && !result.isError
    );
    const sourcedResults = results.filter((_, index) => sourced[index]);

    return {
        totals,
        sum,
        isLoading: pending.length > 0,
        isError:
            sourcedResults.length > 0 &&
            sourcedResults.every(result => result.isError && result.data === undefined),
        refetch: () => results.forEach(result => result.isError && void result.refetch())
    };
};

/** The account's formatted fiat total and whether its request is still pending. */
export const useAccountFiatTotalDisplay = (account: Account) => {
    const fiat = useUserFiat();
    const accounts = useMemo(() => [account], [account]);
    const { totals, isLoading } = useAccountsFiatTotals(accounts);
    const total = totals[0];

    return {
        label: total ? formatFiatCurrency(fiat, total) : '—',
        isLoading
    };
};

/** The account's fiat total formatted for a list row, or an em dash when unavailable. */
export const useAccountFiatTotalLabel = (account: Account) =>
    useAccountFiatTotalDisplay(account).label;

/**
 * Totals for the Dashboard: per account exactly as the switcher shows them,
 * plus a sum in which the accounts of one seed — the same backend wallet
 * holding different TON versions — count their shared EVM / BTC / TRON
 * balances once. Such a group is summed by a single request that owns every
 * TON version the group holds; every other account contributes its own
 * total. A group runs in safe mode when any of its accounts does.
 */
export const useDashboardFiatTotals = (accounts: Account[]): AccountsFiatTotals => {
    const perAccount = useAccountsFiatTotals(accounts);
    const fiat = useUserFiat();
    const safeModeEnabled = useAccountsSafeModeEnabled(accounts);
    const { data: dustFilters } = useDustFilters();
    const hideDust = dustFilters?.hideDustBalances;

    const groups = useMemo(() => {
        const byWalletId = new Map<string, AccountMultichain[]>();
        for (const account of accounts) {
            if (account.type !== 'multichain') continue;
            const credentials = multichainApiWalletCredentials(account);
            if (!credentials) continue;
            const group = byWalletId.get(credentials.walletId) ?? [];
            group.push(account);
            byWalletId.set(credentials.walletId, group);
        }
        return [...byWalletId.values()].filter(group => group.length > 1);
    }, [accounts]);

    const groupQueries = useQueries({
        queries: groups.map(group => {
            const credentials = multichainApiWalletCredentials(group[0])!;
            const safeModes = group.map(account => safeModeEnabled[accounts.indexOf(account)]);
            const verifiedOnly = safeModes.some(enabled => enabled === true);
            const tonWalletIds = group.map(account => account.activeTonWallet.id).sort();
            return {
                queryKey: [
                    QueryKey.walletsListFiatTotals,
                    'seed',
                    credentials.walletId,
                    tonWalletIds,
                    fiat,
                    verifiedOnly,
                    hideDust
                ],
                queryFn: async (): Promise<BigNumber> => {
                    const { totalFiat } = await getOwnMultichainWalletAssets({
                        walletId: credentials.walletId,
                        walletAuthKey: credentials.walletAuthKey,
                        ownedAccountTypes: multichainOwnedAccountTypesForTonVersions(
                            group.map(account => account.activeTonWallet.version)
                        ),
                        currency: fiat,
                        verifiedOnly,
                        hideDust: hideDust === true
                    });
                    return totalFiat;
                },
                enabled:
                    safeModes.every(enabled => enabled !== undefined) && hideDust !== undefined,
                staleTime: FRESHNESS_MS,
                keepPreviousData: true,
                retry: false
            };
        })
    });

    const grouped = new Set<Account>(groups.flat());
    let sum = perAccount.totals.reduce<BigNumber>(
        (acc, total, index) => (total && !grouped.has(accounts[index]) ? acc.plus(total) : acc),
        new BigNumber(0)
    );
    for (const result of groupQueries) {
        if (result.data) sum = sum.plus(result.data);
    }

    return {
        ...perAccount,
        sum,
        isLoading:
            perAccount.isLoading ||
            groupQueries.some(result => result.data === undefined && !result.isError),
        refetch: () => {
            perAccount.refetch();
            groupQueries.forEach(result => result.isError && void result.refetch());
        }
    };
};
