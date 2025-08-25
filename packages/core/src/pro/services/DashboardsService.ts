/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Currencies } from '../models/Currencies';
import type { DashboardCellAddress } from '../models/DashboardCellAddress';
import type { DashboardCellNumericCrypto } from '../models/DashboardCellNumericCrypto';
import type { DashboardCellNumericFiat } from '../models/DashboardCellNumericFiat';
import type { DashboardCellString } from '../models/DashboardCellString';
import type { DashboardColumn } from '../models/DashboardColumn';
import type { Lang } from '../models/Lang';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardsService {
    /**
     * Get dashboard column configuration
     * @param lang Lang
     * @returns any Dashboard columns
     * @throws ApiError
     */
    public static getDashboardColumns(
        lang?: Lang,
    ): CancelablePromise<{
        items: Array<DashboardColumn>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/dashboard/columns',
            query: {
                'lang': lang,
            },
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get dashboard analytics data
     * @param lang Lang
     * @param currency Currency
     * @param authorization
     * @param requestBody Data that is expected
     * @returns any Dashboard data
     * @throws ApiError
     */
    public static getDashboardData(
        lang?: Lang,
        currency?: Currencies,
        authorization?: string,
        requestBody?: {
            accounts: Array<string>;
            columns: Array<string>;
        },
    ): CancelablePromise<{
        items: Array<Array<(DashboardCellString | DashboardCellAddress | DashboardCellNumericCrypto | DashboardCellNumericFiat)>>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/dashboard/data',
            headers: {
                'Authorization': authorization,
            },
            query: {
                'lang': lang,
                'currency': currency,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
}
