/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class IapService {
    /**
     * Activate Pro subscription via IAP purchase
     * @param authorization
     * @param requestBody Data that is expected
     * @returns any Ok
     * @throws ApiError
     */
    public static activateIapPurchase(
        authorization: string,
        requestBody: {
            original_transaction_id: string;
        },
    ): CancelablePromise<{
        ok: boolean;
        auth_token?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/iap',
            headers: {
                'Authorization': authorization,
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
