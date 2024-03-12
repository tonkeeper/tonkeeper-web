/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FiatCurrencies } from './FiatCurrencies';
import type { ProServiceDashboardColumnID } from './ProServiceDashboardColumnID';
import type { ProServiceDashboardColumnType } from './ProServiceDashboardColumnType';
export type ProServiceDashboardCellNumericFiat = {
    column_id: ProServiceDashboardColumnID;
    type: ProServiceDashboardColumnType;
    value: string;
    fiat: FiatCurrencies;
};

