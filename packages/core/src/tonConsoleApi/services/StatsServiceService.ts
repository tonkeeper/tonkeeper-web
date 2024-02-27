/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Chain } from '../models/Chain';
import type { StatsDashboard } from '../models/StatsDashboard';
import type { StatsEstimateQuery } from '../models/StatsEstimateQuery';
import type { StatsQuery } from '../models/StatsQuery';
import type { StatsQueryResult } from '../models/StatsQueryResult';
import type { StatsQueryType } from '../models/StatsQueryType';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StatsServiceService {
    /**
     * Get stats db ddl
     * @param chain chain
     * @returns binary Stats db ddl
     * @throws ApiError
     */
    public static getStatsDdl(
        chain?: Chain,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/stats/ddl',
            query: {
                'chain': chain,
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
     * Estimate query
     * @param chain chain
     * @param requestBody Data that is expected
     * @returns StatsEstimateQuery Estimate query
     * @throws ApiError
     */
    public static estimateStatsQuery(
        chain?: Chain,
        requestBody?: {
            project_id: number;
            query?: string;
            gpt_message?: string;
            /**
             * cyclic execution of requests
             */
            repeat_interval?: number;
        },
    ): CancelablePromise<StatsEstimateQuery> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/stats/query/estimate',
            query: {
                'chain': chain,
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
    /**
     * Send query to stats service
     * @param chain chain
     * @param requestBody Data that is expected
     * @returns StatsQueryResult Query result
     * @throws ApiError
     */
    public static sendQueryToStats(
        chain?: Chain,
        requestBody?: {
            project_id: number;
            query?: string;
            gpt_message?: string;
            /**
             * cyclic execution of requests
             */
            repeat_interval?: number;
        },
    ): CancelablePromise<StatsQueryResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/stats/query',
            query: {
                'chain': chain,
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
    /**
     * Get result by sql query id
     * @param id Query ID
     * @returns StatsQueryResult Query result
     * @throws ApiError
     */
    public static getSqlResultFromStats(
        id: string,
    ): CancelablePromise<StatsQueryResult> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/stats/query/{id}',
            path: {
                'id': id,
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
     * Update query
     * @param id Query ID
     * @param projectId Project ID
     * @param requestBody Data that is expected
     * @returns StatsQuery Query
     * @throws ApiError
     */
    public static updateStatsQuery(
        id: string,
        projectId: number,
        requestBody?: {
            /**
             * cyclic execution of requests
             */
            repeat_interval: number;
        },
    ): CancelablePromise<StatsQuery> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/stats/query/{id}',
            path: {
                'id': id,
            },
            query: {
                'project_id': projectId,
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
    /**
     * Get sql history queries
     * @param projectId Project ID
     * @param offset Offset
     * @param limit Limit
     * @param type
     * @param isRepetitive
     * @returns any History of queries
     * @throws ApiError
     */
    public static getSqlHistoryFromStats(
        projectId: number,
        offset?: number,
        limit: number = 100,
        type?: Array<StatsQueryType>,
        isRepetitive?: boolean,
    ): CancelablePromise<{
        count: number;
        items: Array<StatsQueryResult>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/stats/queries/history',
            query: {
                'project_id': projectId,
                'offset': offset,
                'limit': limit,
                'type': type,
                'is_repetitive': isRepetitive,
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
     * Get an intersection between accounts
     * @param addresses Addresses
     * @param projectId Project ID
     * @param chain chain
     * @param onlyBetween
     * @param repeatInterval cyclic execution of requests
     * @returns StatsQueryResult Query result
     * @throws ApiError
     */
    public static getGraphFromStats(
        addresses: string,
        projectId: number,
        chain?: Chain,
        onlyBetween: boolean = false,
        repeatInterval?: number,
    ): CancelablePromise<StatsQueryResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/stats/cosmos/graph',
            query: {
                'chain': chain,
                'addresses': addresses,
                'only_between': onlyBetween,
                'project_id': projectId,
                'repeat_interval': repeatInterval,
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
     * Send request to ChatGPT
     * @param projectId Project ID
     * @param chain chain
     * @param requestBody Data that is expected
     * @returns any Answer from ChatGPT
     * @throws ApiError
     */
    public static statsChatGptRequest(
        projectId: number,
        chain?: Chain,
        requestBody?: {
            message: string;
            context?: string;
        },
    ): CancelablePromise<{
        message: string;
        valid: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/stats/gpt',
            query: {
                'project_id': projectId,
                'chain': chain,
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
    /**
     * Price per request for ChatGPT
     * @param projectId Project ID
     * @returns any Price per request for ChatGPT
     * @throws ApiError
     */
    public static getStatsChatGptPrice(
        projectId: number,
    ): CancelablePromise<{
        free_requests: number;
        used: number;
        price: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/stats/price/gpt',
            query: {
                'project_id': projectId,
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
     * Create dashboard
     * @param projectId Project ID
     * @param requestBody Data that is expected
     * @returns StatsDashboard Dashboard
     * @throws ApiError
     */
    public static createStatsDashboard(
        projectId: number,
        requestBody?: {
            name?: string;
            public?: boolean;
            active?: boolean;
            attributes?: any;
            query_ids?: Array<string>;
        },
    ): CancelablePromise<StatsDashboard> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/stats/dashboard',
            query: {
                'project_id': projectId,
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
    /**
     * Get dashboard
     * @param id Dashboard ID
     * @param projectId Project ID
     * @returns StatsDashboard Dashboard
     * @throws ApiError
     */
    public static getStatsDashboard(
        id: string,
        projectId: number,
    ): CancelablePromise<StatsDashboard> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/stats/dashboard/{id}',
            path: {
                'id': id,
            },
            query: {
                'project_id': projectId,
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
     * Update dashboard
     * @param id Dashboard ID
     * @param projectId Project ID
     * @param requestBody Data that is expected
     * @returns StatsDashboard Dashboard
     * @throws ApiError
     */
    public static updateStatsDashboard(
        id: string,
        projectId: number,
        requestBody?: {
            name?: string;
            public?: boolean;
            active?: boolean;
            attributes?: any;
            query_ids?: Array<string>;
        },
    ): CancelablePromise<StatsDashboard> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/stats/dashboard/{id}',
            path: {
                'id': id,
            },
            query: {
                'project_id': projectId,
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
    /**
     * Get dashboards
     * @param projectId Project ID
     * @returns any Dashboards
     * @throws ApiError
     */
    public static getStatsDashboards(
        projectId: number,
    ): CancelablePromise<{
        items: Array<StatsDashboard>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/stats/dashboards',
            query: {
                'project_id': projectId,
            },
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
}
