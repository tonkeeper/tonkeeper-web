import { useAppSdk } from '../appSdk';
import { DASHBOARD_COLUMNS } from '../../components/dashboard/columns/DASHBOARD_COLUMNS';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';

export type DashboardCategoriesStore = { name: DASHBOARD_COLUMNS; isEnabled: boolean }[];
const defaultDashboardCategoriesStore: DashboardCategoriesStore = [
    {
        name: DASHBOARD_COLUMNS.ADDRESS,
        isEnabled: true
    },
    {
        name: DASHBOARD_COLUMNS.TOTAL,
        isEnabled: true
    },
    {
        name: DASHBOARD_COLUMNS.BALANCE_TON,
        isEnabled: true
    },
    {
        name: DASHBOARD_COLUMNS.STORAGE,
        isEnabled: true
    },
    {
        name: DASHBOARD_COLUMNS.CURRENT_MONTH,
        isEnabled: false
    }
];

export function useDashboardCategories() {
    const client = useQueryClient();
    const { storage } = useAppSdk();
    const categories = useQuery<DashboardCategoriesStore>(
        [QueryKey.dashboardCategories],
        async () => {
            const stored = await storage.get<DashboardCategoriesStore>('dashboard-categories');
            return stored ?? defaultDashboardCategoriesStore;
        }
    );

    const mutate = useMutation(async (val: DashboardCategoriesStore) => {
        await storage.set('dashboard-categories', val);
        await client.invalidateQueries([QueryKey.dashboardCategories]);
    });

    return [categories, mutate] as const;
}
