/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TestnetServiceService {
    /**
     * Check available coins
     * @returns any Available balance
     * @throws ApiError
     */
    public static getTestnetAvailable(): CancelablePromise<{
        balance: number;
        price_multiplicator: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/testnet/available',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Buy testnet coins
     * @param projectId Project ID
     * @param requestBody Data that is expected
     * @returns any Message hash
     * @throws ApiError
     */
    public static buyTestnetCoins(
        projectId: number,
        requestBody?: {
            address: string;
            /**
             * nano ton are expected
             */
            coins: number;
        },
    ): CancelablePromise<{
        hash: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/testnet/buy/coins',
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
}
