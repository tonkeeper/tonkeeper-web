/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Account } from '../models/Account';
import type { URL } from '../models/URL';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MinterJettonMediaService {
    /**
     * Get jettons by owner
     * @param address Address
     * @returns any Accounts
     * @throws ApiError
     */
    public static getJettonsByOwner(
        address: string,
    ): CancelablePromise<{
        items: Array<Account>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/minter/owner/jettons',
            query: {
                'address': address,
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
     * Upload jetton media
     * @param formData Data that is expected
     * @returns URL URL
     * @throws ApiError
     */
    public static uploadMinterJettonMedia(
        formData?: {
            media: Blob;
        },
    ): CancelablePromise<URL> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/minter/jetton/media',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Upload jetton meta
     * @param requestBody Data that is expected
     * @returns URL URL
     * @throws ApiError
     */
    public static uploadMinterJettonMeta(
        requestBody?: {
            meta: any;
        },
    ): CancelablePromise<URL> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/minter/jetton/meta',
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
