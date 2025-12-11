/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Lang } from '../models/Lang';
import type { SubscriptionExtension } from '../models/SubscriptionExtension';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ExtensionsService {
    /**
     * Activate Pro subscription as wallet extension
     * @param authorization
     * @param lang Lang
     * @param requestBody Data that is expected
     * @returns SubscriptionExtension Subscription created successfully
     * @throws ApiError
     */
    public static createSubscriptionExtension(
        authorization: string,
        lang?: Lang,
        requestBody?: {
            tier_id: number;
            promo_code?: string;
        },
    ): CancelablePromise<SubscriptionExtension> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/extensions/subscription',
            headers: {
                'Authorization': authorization,
            },
            query: {
                'lang': lang,
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
