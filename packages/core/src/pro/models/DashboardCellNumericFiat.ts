/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardColumnID } from './DashboardColumnID';
import type { DashboardColumnType } from './DashboardColumnType';
import type { FiatCurrencies } from './FiatCurrencies';
export type DashboardCellNumericFiat = {
    column_id: DashboardColumnID;
    type: DashboardColumnType;
    value: string;
    fiat: FiatCurrencies;
};

