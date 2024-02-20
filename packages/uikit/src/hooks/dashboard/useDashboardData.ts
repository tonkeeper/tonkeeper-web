import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { DashboardCell } from './dashboard-column';
import { useDashboardColumnsAsForm } from './useDashboardColumns';
import BigNumber from 'bignumber.js';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { useAppContext } from '../appContext';

export function useDashboardData() {
    const { data: columns } = useDashboardColumnsAsForm();
    const selectedColumns = columns?.filter(c => c.isEnabled);
    const { fiat } = useAppContext();

    return useQuery<DashboardCell[][]>(
        [QueryKey.dashboardData, selectedColumns, fiat],
        async () => {
            const mockRow: DashboardCell[] = (selectedColumns?.map(
                c => mocks[c.id as keyof typeof mocks]
            ) || []) as DashboardCell[];
            return [
                mockRow,
                mockRow,
                mockRow,
                mockRow,
                mockRow,
                mockRow,
                mockRow,
                mockRow,
                mockRow,
                mockRow,
                mockRow,
                mockRow,
                mockRow,
                mockRow
            ];
        },
        {
            enabled: !!selectedColumns
        }
    );
}

const mocks = {
    address: {
        type: 'address',
        raw: '0:' + '0'.repeat(64)
    },
    total: {
        type: 'numeric_fiat',
        value: new BigNumber(1234),
        fiat: FiatCurrencies.USD
    },
    balance_ton: {
        type: 'numeric_crypto',
        value: new BigNumber(12345678909876),
        decimals: 9,
        symbol: 'TON'
    },
    storage: {
        type: 'string',
        value: 'keychain'
    }
};
