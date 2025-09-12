/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DashboardColumnID } from './DashboardColumnID';
import type { DashboardColumnType } from './DashboardColumnType';
export type DashboardColumn = {
    id: DashboardColumnID;
    name: string;
    column_type: DashboardColumnType;
    checked_default: boolean;
    only_pro: boolean;
};

