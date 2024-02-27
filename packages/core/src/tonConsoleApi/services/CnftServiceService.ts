/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CnftCollection } from '../models/CnftCollection';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CnftServiceService {
    /**
     * Compress NFT config
     * @returns any Compress NFT config
     * @throws ApiError
     */
    public static cnftConfig(): CancelablePromise<{
        price_per_nft: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/cnft/config',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get info about compress collection account
     * @param account Account
     * @returns CnftCollection Compress NFT collection
     * @throws ApiError
     */
    public static getInfoCnftCollectionAccount(
        account: string,
    ): CancelablePromise<CnftCollection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/cnft/collection/{account}',
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
    /**
     * Indexing compress NFTs
     * @param projectId Project ID
     * @param requestBody Data that is expected
     * @returns CnftCollection Compress NFT collection
     * @throws ApiError
     */
    public static indexingCnftCollection(
        projectId: number,
        requestBody?: {
            account: string;
            count: number;
        },
    ): CancelablePromise<CnftCollection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/cnft/indexing',
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
     * Get paid compress NFT collections
     * @param projectId Project ID
     * @returns any Paid compress NFT collections
     * @throws ApiError
     */
    public static cnftPaidCollections(
        projectId: number,
    ): CancelablePromise<{
        items: Array<CnftCollection>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/cnft/paid/collections',
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
