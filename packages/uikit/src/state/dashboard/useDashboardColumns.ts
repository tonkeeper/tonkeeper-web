import { useAppSdk } from '../../hooks/appSdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { useTranslation } from '../../hooks/translation';
import { DashboardColumn, isSupportedColumnType } from '@tonkeeper/core/dist/entries/dashboard';
import { getDashboardColumns } from '@tonkeeper/core/dist/service/proService';
import { useProState } from '../pro';

export type DashboardColumnsForm = { id: string; isEnabled: boolean }[];

export const ClientColumns: (Omit<DashboardColumn, 'name'> & { i18Key: string })[] = [
    {
        type: 'string',
        i18Key: 'dashboard_column_name',
        id: 'name',
        defaultIsChecked: true,
        onlyPro: false
    }
];

export function useDashboardColumnsForm() {
    const client = useQueryClient();
    const { storage } = useAppSdk();
    const { data: proState } = useProState();

    const { data: columns } = useDashboardColumns();

    const categories = useQuery<DashboardColumnsForm>(
        [QueryKey.dashboardColumnsForm, columns],
        async () => {
            if (!columns?.length) {
                return [];
            }
            const stored = await storage.get<DashboardColumnsForm>('dashboard-columns');

            if (stored) {
                const storedList = stored
                    .map(storedColumn => {
                        const columnInfo = columns.find(column => column.id === storedColumn.id);
                        if (!columnInfo || !isSupportedColumnType(columnInfo.type)) {
                            return null;
                        }

                        return {
                            id: storedColumn.id,
                            isEnabled:
                                columnInfo.onlyPro && !proState?.subscription.valid
                                    ? false
                                    : storedColumn.isEnabled ?? columnInfo.defaultIsChecked
                        };
                    })
                    .filter(Boolean) as DashboardColumnsForm;

                const newColumns = columns
                    .filter(c => stored.every(s => s.id !== c.id))
                    .map(c => ({
                        id: c.id,
                        isEnabled:
                            c.onlyPro && !proState?.subscription.valid ? false : c.defaultIsChecked
                    }));
                return storedList.concat(newColumns);
            }
            return columns.map(c => ({
                id: c.id,
                isEnabled: c.onlyPro && !proState?.subscription.valid ? false : c.defaultIsChecked
            }));
        },
        {
            enabled: !!columns && !!proState
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
        i18n: { language },
        t
    } = useTranslation();
    return useQuery<DashboardColumn[]>([QueryKey.dashboardColumns, language], async () => {
        const response = await getDashboardColumns(language);

        const clientColumns: DashboardColumn[] = ClientColumns.map(c => ({
            ...c,
            name: t(c.i18Key)
        }));

        return clientColumns.concat(response.filter(column => isSupportedColumnType(column.type)));
    });
}
