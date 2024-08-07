import BigNumber from 'bignumber.js';
import { FiatCurrencies } from './fiat';
import { Address } from '@ton/core';

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
    columnId: string;
    type: 'string';
    value: string;
};

export type DashboardCellAddress = {
    columnId: string;
    type: 'address';
    raw: string;
};

export type DashboardCellNumeric = {
    columnId: string;
    type: 'numeric';
    value: string;
    decimalPlaces?: number;
};

export type DashboardCellNumericCrypto = {
    columnId: string;
    type: 'numeric_crypto';
    value: BigNumber;
    decimals: number;
    symbol: string;
};

export type DashboardCellNumericFiat = {
    columnId: string;
    type: 'numeric_fiat';
    value: BigNumber;
    fiat: FiatCurrencies;
};

export function toStringDashboardCell(cell: DashboardCell): string {
    switch (cell.type) {
        case 'string':
            return cell.value;
        case 'address':
            return Address.parse(cell.raw).toString();
        case 'numeric':
            return cell.value;
        case 'numeric_crypto':
            return cell.value.div(10 ** cell.decimals).toString() + ' ' + cell.symbol;
        case 'numeric_fiat':
            return cell.value.toString() + ' ' + cell.fiat;
    }
}
