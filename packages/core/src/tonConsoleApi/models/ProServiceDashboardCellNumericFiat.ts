/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Currencies } from './Currencies';
import type { ProServiceDashboardColumnID } from './ProServiceDashboardColumnID';
import type { ProServiceDashboardColumnType } from './ProServiceDashboardColumnType';
export type ProServiceDashboardCellNumericFiat = {
    column_id: ProServiceDashboardColumnID;
    type: ProServiceDashboardColumnType;
    value: string;
    fiat: Currencies;
};

