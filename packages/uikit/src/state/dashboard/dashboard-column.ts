import BigNumber from 'bignumber.js';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';

export const columnsTypes = [
    'string',
    'address',
    'numeric',
    'numeric_crypto',
    'numeric_fiat'
] as const;

export type DashboardColumnType = (typeof columnsTypes)[number];

export function isSupportedColumnType(value: string): value is DashboardColumnType {
    return columnsTypes.includes(value as DashboardColumnType);
}

export type DashboardColumn = {
    id: string;
    name: string;
    description?: string;
    type: (typeof columnsTypes)[number];
    defaultIsChecked: boolean;
    onlyPro: boolean;
};

export type DashboardCell =
    | DashboardCellString
    | DashboardCellAddress
    | DashboardCellNumeric
    | DashboardCellNumericCrypto
    | DashboardCellNumericFiat;

export type DashboardCellString = {
    type: 'string';
    value: string;
};

export type DashboardCellAddress = {
    type: 'address';
    raw: string;
};

export type DashboardCellNumeric = {
    type: 'numeric';
    value: string;
    decimalPlaces?: number;
};

export type DashboardCellNumericCrypto = {
    type: 'numeric_crypto';
    value: BigNumber;
    decimals: number;
    symbol: string;
};

export type DashboardCellNumericFiat = {
    type: 'numeric_fiat';
    value: BigNumber;
    fiat: FiatCurrencies;
};
