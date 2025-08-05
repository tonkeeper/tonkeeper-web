/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Currencies } from './Currencies';
import type { DashboardColumnID } from './DashboardColumnID';
import type { DashboardColumnType } from './DashboardColumnType';
export type DashboardCellNumericFiat = {
    column_id: DashboardColumnID;
    type: DashboardColumnType;
    value: string;
    fiat: Currencies;
};

