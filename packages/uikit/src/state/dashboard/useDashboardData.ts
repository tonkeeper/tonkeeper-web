import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { DashboardRow, DashboardRowNullable } from '@tonkeeper/core/dist/entries/dashboard';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { sortWalletsByVersion, TonContract } from '@tonkeeper/core/dist/entries/wallet';
import { getDashboardData } from '@tonkeeper/core/dist/service/proService';
import { IAppContext, useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { ClientColumns, useDashboardColumnsAsForm } from './useDashboardColumns';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { useAccountsOrdered } from '../folders';
import { seeIfMainnnetAccount, Account } from '@tonkeeper/core/dist/entries/account';
import { useAppSdk } from '../../hooks/appSdk';
import BigNumber from 'bignumber.js';
import { fetchStakedFiatPerWallet } from '../asset';
import { useRate } from '../rates';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../tonendpoint';

const sortedAccountWallets = (a: Account) => {
    if (a.type === 'mnemonic' || a.type === 'ton-only') {
        return [...a.allTonWallets].sort(sortWalletsByVersion);
    }

    return a.allTonWallets;
};

const TOTAL_BALANCE_COLUMN_ID = 'total_balance';

async function applyStakingToDashboardTotalBalance(
    rows: DashboardRow[],
    columns: string[],
    accountsFormatted: string[],
    mainnetWallets: ReadonlyArray<TonContract & { account: Account }>,
    appContext: IAppContext,
    tonRate: { prices?: number } | undefined,
    isStakingEnabled: boolean
): Promise<DashboardRow[]> {
    const colIndex = columns.indexOf(TOTAL_BALANCE_COLUMN_ID);
    if (colIndex === -1 || !isStakingEnabled || tonRate?.prices === undefined) {
        return rows;
    }

    const rawAddresses = accountsFormatted.map(walletAddress => {
        const wallet = mainnetWallets.find(w =>
            Address.parse(w.rawAddress).equals(Address.parse(walletAddress))
        );
        return wallet?.rawAddress;
    });

    if (rawAddresses.some(a => !a)) {
        return rows;
    }

    const stakedPerWallet = await fetchStakedFiatPerWallet(
        appContext,
        Network.MAINNET,
        rawAddresses as string[],
        new BigNumber(tonRate.prices)
    );

    return rows.map((row, rowIndex) => {
        const add = stakedPerWallet[rowIndex];
        if (!add || add.isZero()) {
            return row;
        }
        const cell = row.cells[colIndex];
        if (!cell || cell.columnId !== TOTAL_BALANCE_COLUMN_ID) {
            return row;
        }
        if (cell.type === 'numeric_fiat') {
            const newCells = [...row.cells];
            newCells[colIndex] = {
                ...cell,
                value: cell.value.plus(add)
            };
            return { ...row, cells: newCells };
        }
        return row;
    });
}

export function useDashboardData() {
    const sdk = useAppSdk();
    const { data: columns } = useDashboardColumnsAsForm();
    const selectedColumns = columns?.filter(c => c.isEnabled);
    const appContext = useAppContext();
    const { fiat } = appContext;
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const isStakingEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.STAKING);
    const {
        i18n: { language },
        t
    } = useTranslation();
    const selectedColIds = selectedColumns?.map(c => c.id);
    const client = useQueryClient();

    const accountsState = useAccountsOrdered();
    const mainnetWallets = accountsState
        .filter(seeIfMainnnetAccount)
        .flatMap(a => sortedAccountWallets(a).map(item => ({ ...item, account: a })));
    const idsMainnet = mainnetWallets.map(w => w!.id);

    return useQuery<DashboardRow[]>(
        [
            QueryKey.dashboardData,
            selectedColIds,
            idsMainnet,
            fiat,
            language,
            tonRate?.prices,
            isStakingEnabled
        ],
        async ctx => {
            if (!selectedColIds?.length || !idsMainnet?.length || !mainnetWallets?.length) {
                return [];
            }

            const accounts = mainnetWallets.map(acc => formatAddress(acc!.rawAddress));

            const loadData = async (query: { columns: string[]; accounts: string[] }) => {
                const queryToFetch = {
                    columns: query.columns.filter(col => !ClientColumns.some(c => c.id === col)),
                    accounts: query.accounts
                };

                let fetchResult: DashboardRow[] = query.accounts.map(id => ({ id, cells: [] }));
                if (queryToFetch.columns.length > 0) {
                    fetchResult = await getDashboardData(queryToFetch, {
                        currency: fiat,
                        lang: language,
                        token: await sdk.subscriptionService.getToken()
                    });
                }

                /* append client columns */
                const defaultWalletName = t('wallet_title');
                const result: DashboardRow[] = query.accounts.map(acc => ({
                    id: acc,
                    cells: []
                }));
                query.accounts.forEach((walletAddress, rowIndex) => {
                    const wallet = mainnetWallets.find(w =>
                        Address.parse(w!.rawAddress).equals(Address.parse(walletAddress))
                    );
                    query.columns.forEach((col, colIndex) => {
                        const ClientColumnName = ClientColumns.find(c => c.id === 'name')!;
                        if (col === ClientColumnName.id) {
                            if (wallet) {
                                result[rowIndex].cells[colIndex] = {
                                    columnId: ClientColumnName.id,
                                    type: 'account_name',
                                    account: wallet!.account,
                                    walletId: wallet!.rawAddress
                                };
                            } else {
                                result[rowIndex].cells[colIndex] = {
                                    columnId: ClientColumnName.id,
                                    type: 'string',
                                    value: defaultWalletName
                                };
                            }
                            return;
                        }

                        result[rowIndex].cells[colIndex] =
                            fetchResult[rowIndex].cells[queryToFetch.columns.indexOf(col)];
                    });
                });
                /* append client columns */

                return applyStakingToDashboardTotalBalance(
                    result,
                    query.columns,
                    query.accounts,
                    mainnetWallets,
                    appContext,
                    tonRate,
                    isStakingEnabled
                );
            };

            const pastQueries = client.getQueriesData({
                predicate: q =>
                    q.queryKey[0] === QueryKey.dashboardData &&
                    !!q.queryKey[1] &&
                    !!q.queryKey[2] &&
                    q.queryKey[3] === ctx.queryKey[3] &&
                    q.queryKey[4] === ctx.queryKey[4] &&
                    q.queryKey[5] === ctx.queryKey[5] &&
                    q.queryKey[6] === ctx.queryKey[6],
                fetchStatus: 'idle'
            });

            /* cache */
            if (pastQueries?.length) {
                const walletsToQuerySet = new Set<TonContract>();
                const columnsToQuerySet = new Set<string>();

                const result: DashboardRowNullable[] = idsMainnet.map(id => ({
                    id,
                    cells: []
                }));
                idsMainnet.forEach((id, walletIndex) => {
                    selectedColIds.forEach((col, colIndex) => {
                        const matchingQueries = pastQueries.filter(
                            ([key]) =>
                                (key[2] as string[] | undefined)?.includes(id) &&
                                (key[1] as string[] | undefined)?.includes(col)
                        );

                        if (!matchingQueries.length) {
                            result[walletIndex].cells[colIndex] = null;
                            walletsToQuerySet.add(mainnetWallets[walletIndex]!);
                            columnsToQuerySet.add(col);
                            return;
                        }

                        const [actualQueryKey, actualQueryValue] =
                            matchingQueries[matchingQueries.length - 1];
                        const actualQueryWalletIndex = (actualQueryKey[2] as string[]).indexOf(id);
                        const actualQueryColIndex = (actualQueryKey[1] as string[]).indexOf(col);

                        result[walletIndex].cells[colIndex] = (actualQueryValue as DashboardRow[])[
                            actualQueryWalletIndex
                        ].cells[actualQueryColIndex];
                    });
                });

                const walletsToQuery = [...walletsToQuerySet.values()];
                const accountsToQuery = walletsToQuery.map(acc => formatAddress(acc.rawAddress));
                const columnsToQuery = [...columnsToQuerySet.values()];

                if (!accountsToQuery.length || !columnsToQuery.length) {
                    return result as DashboardRow[];
                }

                const newData = await loadData({
                    accounts: accountsToQuery,
                    columns: columnsToQuery
                });

                newData.forEach((row, rowIndex) => {
                    const walletIndex = idsMainnet.indexOf(walletsToQuery[rowIndex].id);
                    row.cells.forEach(cell => {
                        const colIndex = selectedColIds.indexOf(cell.columnId);
                        result[walletIndex].cells[colIndex] = cell;
                    });
                });

                return result as DashboardRow[];
            }
            /* cache */

            return loadData({ accounts, columns: selectedColIds });
        },
        {
            enabled: !!selectedColIds && !!mainnetWallets
        }
    );
}
