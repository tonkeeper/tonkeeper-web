/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MintlessJetton } from '../models/MintlessJetton';
import type { Ok } from '../models/Ok';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MintlessJettonServiceService {
    /**
     * Get mintless jetton config
     * @returns any Mintless Jetton config
     * @throws ApiError
     */
    public static getMintlessJettonConfig(): CancelablePromise<{
        price_per_jetton: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/mintless/config',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get paid mintless jettons
     * @param projectId Project ID
     * @returns any Mintless Jettons
     * @throws ApiError
     */
    public static getPaidMintlessJettons(
        projectId: number,
    ): CancelablePromise<{
        jettons: Array<MintlessJetton>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/mintless/paid',
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
     * Check if a mintless jetton exists
     * @param account Account
     * @returns Ok Ok
     * @throws ApiError
     */
    public static checkExistsMintlessJetton(
        account: string,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/mintless/{account}',
            path: {
                'account': account,
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
