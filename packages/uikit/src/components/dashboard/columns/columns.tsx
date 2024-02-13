import { DASHBOARD_COLUMNS, DashboardRow } from './DASHBOARD_COLUMNS';
import { AddressTd, AddressTh } from './Address';
import { TotalTd, TotalTh } from './Total';
import { BalanceTONTd, BalanceTONTh } from './BalanceTON';

export const Headings = {
    [DASHBOARD_COLUMNS.ADDRESS]: <AddressTh />,
    [DASHBOARD_COLUMNS.TOTAL]: <TotalTh />,
    [DASHBOARD_COLUMNS.BALANCE_TON]: <BalanceTONTh />,
    [DASHBOARD_COLUMNS.STORAGE]: <></>,
    [DASHBOARD_COLUMNS.CURRENT_MONTH]: <></>
};

export const Cells = {
    [DASHBOARD_COLUMNS.ADDRESS]: (args: DashboardRow[DASHBOARD_COLUMNS.ADDRESS]) => (
        <AddressTd {...args} />
    ),
    [DASHBOARD_COLUMNS.TOTAL]: (args: DashboardRow[DASHBOARD_COLUMNS.TOTAL]) => (
        <TotalTd balance={args} />
    ),
    [DASHBOARD_COLUMNS.BALANCE_TON]: (args: DashboardRow[DASHBOARD_COLUMNS.BALANCE_TON]) => (
        <BalanceTONTd balance={args} />
    ),
    [DASHBOARD_COLUMNS.STORAGE]: () => <></>,
    [DASHBOARD_COLUMNS.CURRENT_MONTH]: () => <></>
};
