import { useAppSdk } from '../../hooks/appSdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { DashboardColumn, isSupportedColumnType } from './dashboard-column';
import { useTranslation } from '../../hooks/translation';

export type DashboardColumnsForm = { id: string; isEnabled: boolean }[];

export function useDashboardColumnsForm() {
    const client = useQueryClient();
    const { storage } = useAppSdk();

    const { data: columns } = useDashboardColumns();

    const categories = useQuery<DashboardColumnsForm>(
        [QueryKey.dashboardColumnsForm, columns],
        async () => {
            if (!columns?.length) {
                return [];
            }
            const stored = await storage.get<DashboardColumnsForm>('dashboard-columns');

            if (stored) {
                return columns
                    .filter(c => isSupportedColumnType(c.type))
                    .map(c => ({
                        id: c.id,
                        isEnabled:
                            stored.find(item => item.id === c.id)?.isEnabled ?? c.defaultIsChecked
                    }));
            }
            return columns.map(c => ({ id: c.id, isEnabled: c.defaultIsChecked }));
        },
        {
            enabled: !!columns
        }
    );

    const mutate = useMutation(async (val: DashboardColumnsForm) => {
        await storage.set('dashboard-columns', val);
        await client.invalidateQueries([QueryKey.dashboardColumnsForm]);
    });

    return [categories, mutate] as const;
}

export function useDashboardColumnsAsForm() {
    const [{ data: form }] = useDashboardColumnsForm();
    const { data: columns } = useDashboardColumns();

    return useQuery<(DashboardColumn & { isEnabled: boolean })[]>(
        [QueryKey.selectedDashboardColumns, columns, form],
        () => {
            return (
                (form
                    ?.map(col => {
                        const colInfo = columns?.find(item => item.id === col.id);
                        if (!colInfo) {
                            return null;
                        }

                        return { ...colInfo, isEnabled: col.isEnabled };
                    })
                    .filter(Boolean) as (DashboardColumn & { isEnabled: boolean })[]) || []
            );
        },
        {
            enabled: !!form
        }
    );
}

export function useDashboardColumns() {
    const {
        i18n: { language }
    } = useTranslation();
    return useQuery<DashboardColumn[]>([QueryKey.dashboardColumns, language], async () => {
        const response = [
            {
                id: 'address',
                name: 'Address',
                type: 'address' as const,
                defaultIsChecked: true,
                onlyPro: false
            },
            {
                id: 'total',
                name: 'Total',
                type: 'numeric_fiat' as const,
                defaultIsChecked: true,
                onlyPro: false
            },
            {
                id: 'balance_ton',
                name: 'Balance TON',
                type: 'numeric_crypto' as const,
                defaultIsChecked: true,
                onlyPro: false
            },
            {
                id: 'storage',
                name: 'Storage',
                type: 'string' as const,
                defaultIsChecked: true,
                onlyPro: false
            },
            {
                id: 'send_current',
                name: 'Send current month',
                type: 'numeric_crypto' as const,
                defaultIsChecked: false,
                onlyPro: true
            },
            {
                id: 'send_prev',
                name: 'Send previous month',
                type: 'numeric_crypto' as const,
                defaultIsChecked: false,
                onlyPro: true
            },
            {
                id: 'received_current',
                name: 'Received current month',
                type: 'numeric_crypto' as const,
                defaultIsChecked: false,
                onlyPro: true
            },
            {
                id: 'received_prev',
                name: 'Received previous month',
                type: 'numeric_crypto' as const,
                defaultIsChecked: true,
                onlyPro: true
            }
        ];

        return response.filter(column => isSupportedColumnType(column.type));
    });
}