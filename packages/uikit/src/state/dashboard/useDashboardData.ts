import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { DashboardRow, DashboardRowNullable } from '@tonkeeper/core/dist/entries/dashboard';
import { TonContract } from '@tonkeeper/core/dist/entries/wallet';
import { getDashboardData } from '@tonkeeper/core/dist/service/proService';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { ClientColumns, useDashboardColumnsAsForm } from './useDashboardColumns';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import { useAccountsOrdered } from '../folders';
import { seeIfMainnnetAccount } from '@tonkeeper/core/dist/entries/account';

export function useDashboardData() {
    const { data: columns } = useDashboardColumnsAsForm();
    const selectedColumns = columns?.filter(c => c.isEnabled);
    const { fiat } = useAppContext();
    const {
        i18n: { language },
        t
    } = useTranslation();
    const selectedColIds = selectedColumns?.map(c => c.id);
    const client = useQueryClient();

    const accountsState = useAccountsOrdered();
    const mainnetWallets = accountsState
        .filter(seeIfMainnnetAccount)
        .flatMap(a => a.allTonWallets.map(item => ({ ...item, account: a })));
    const idsMainnet = mainnetWallets.map(w => w!.id);

    return useQuery<DashboardRow[]>(
        [QueryKey.dashboardData, selectedColIds, idsMainnet, fiat, language],
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
                        lang: language
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

                return result;
            };

            const pastQueries = client.getQueriesData({
                predicate: q =>
                    q.queryKey[0] === QueryKey.dashboardData &&
                    !!q.queryKey[1] &&
                    !!q.queryKey[2] &&
                    q.queryKey[3] === ctx.queryKey[3] &&
                    q.queryKey[4] === ctx.queryKey[4],
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
                            ([key, _]) =>
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
