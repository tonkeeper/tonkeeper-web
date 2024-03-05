/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InvoicesInvoice } from '../models/InvoicesInvoice';
import type { Lang } from '../models/Lang';
import type { Ok } from '../models/Ok';
import type { ProServiceState } from '../models/ProServiceState';
import type { ProServiceTier } from '../models/ProServiceTier';
import type { TgAuth } from '../models/TgAuth';
import type { TonConnectProof } from '../models/TonConnectProof';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProServiceService {
    /**
     * Generating payload for TonConnect
     * @returns any The generated payload for TonConnect
     * @throws ApiError
     */
    public static proServiceAuthGeneratePayload(): CancelablePromise<{
        payload: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/auth/proof/payload',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Auth via TonConnect
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static proServiceTonConnectAuth(
        requestBody?: TonConnectProof,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/auth/proof/check',
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
     * Logout from the system
     * @returns Ok Ok
     * @throws ApiError
     */
    public static proServiceLogout(): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/logout',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get user info
     * @returns any State
     * @throws ApiError
     */
    public static proServiceGetUserInfo(): CancelablePromise<{
        pub_key: string;
        version: string;
        user_id?: number;
        tg_id?: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/user/info',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get active tiers
     * @param lang Lang
     * @param promoCode Promo code
     * @returns any Active tiers
     * @throws ApiError
     */
    public static getProServiceTiers(
        lang?: Lang,
        promoCode?: string,
    ): CancelablePromise<{
        items: Array<ProServiceTier>;
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
     * Creating an invoice for Pro tier payment
     * @param requestBody Data that is expected
     * @returns InvoicesInvoice Invoice
     * @throws ApiError
     */
    public static createProServiceInvoice(
        requestBody?: {
            tier_id: number;
            promo_code?: string;
        },
    ): CancelablePromise<InvoicesInvoice> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/invoice',
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
     * Get info about the invoice
     * @param id Invoice ID
     * @returns InvoicesInvoice Invoice
     * @throws ApiError
     */
    public static getProServiceInvoice(
        id: string,
    ): CancelablePromise<InvoicesInvoice> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/invoice/{id}',
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
     * The invoice webhook
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static proServiceInvoiceWebhook(
        requestBody?: InvoicesInvoice,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/invoice/webhook',
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
     * Verify Pro tier subscription
     * @returns any Verify
     * @throws ApiError
     */
    public static proServiceVerify(): CancelablePromise<{
        valid: boolean;
        is_trial: boolean;
        used_trial: boolean;
        next_charge?: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/verify',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Activate pro trial period
     * @param requestBody Data that is expected from Telegram
     * @returns Ok Ok
     * @throws ApiError
     */
    public static proServiceTrial(
        requestBody?: TgAuth,
    ): CancelablePromise<Ok> {
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
    /**
     * Get the state
     * @returns ProServiceState State
     * @throws ApiError
     */
    public static proServiceGetState(): CancelablePromise<ProServiceState> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/state',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Update the state
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static proServiceUpdateState(
        requestBody?: ProServiceState,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/pro/state',
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
     * Delete the state
     * @returns Ok Ok
     * @throws ApiError
     */
    public static proServiceDeleteState(): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/services/pro/state',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
}
