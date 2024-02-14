import { Network } from '@tonkeeper/core/dist/entries/network';
import BigNumber from 'bignumber.js';

export enum DASHBOARD_COLUMNS {
    ADDRESS = 'ADDRESS',
    TOTAL = 'TOTAL',
    BALANCE_TON = 'BALANCE_TON',
    STORAGE = 'STORAGE',
    CURRENT_MONTH = 'CURRENT_MONTH'
}

export type DashboardRow = {
    [DASHBOARD_COLUMNS.ADDRESS]: {
        addressRaw: string;
        network: Network;
    };
    [DASHBOARD_COLUMNS.TOTAL]: BigNumber;
    [DASHBOARD_COLUMNS.BALANCE_TON]: BigNumber;
    [DASHBOARD_COLUMNS.STORAGE]: 'keychain' | 'pk';
    [DASHBOARD_COLUMNS.CURRENT_MONTH]: BigNumber;
};

export const DashboardColumnsTranslationKeys: Record<DASHBOARD_COLUMNS, string> = {
    ADDRESS: 'Address',
    BALANCE_TON: 'Balance ton',
    CURRENT_MONTH: 'current month',
    STORAGE: 'storage',
    TOTAL: 'total'
};
