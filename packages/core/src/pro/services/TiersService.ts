/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Lang } from '../models/Lang';
import type { Tier } from '../models/Tier';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TiersService {
    /**
     * Get available subscription tiers
     * @param lang Lang
     * @param promoCode Promo code
     * @returns any Active tiers
     * @throws ApiError
     */
    public static getTiers(
        lang?: Lang,
        promoCode?: string,
    ): CancelablePromise<{
        items: Array<Tier>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/tiers',
            query: {
                'lang': lang,
                'promo_code': promoCode,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Activate Pro trial subscription
     * @param requestBody Data that is expected
     * @returns any Ok
     * @throws ApiError
     */
    public static activateTrial(
        requestBody?: {
            id: number;
            first_name?: string;
            last_name?: string;
            photo_url?: string;
            username?: string;
            hash: string;
            auth_date: number;
        },
    ): CancelablePromise<{
        ok: boolean;
        auth_token?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/trial',
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
