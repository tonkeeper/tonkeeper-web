/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Invoice } from '../models/Invoice';
import type { InvoiceStatus } from '../models/InvoiceStatus';
import type { Ok } from '../models/Ok';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InvoicesService {
    /**
     * Create Pro subscription invoice
     * @param authorization
     * @param requestBody Data that is expected
     * @returns Invoice Invoice created successfully
     * @throws ApiError
     */
    public static createInvoice(
        authorization: string,
        requestBody?: {
            tier_id: number;
            promo_code?: string;
        },
    ): CancelablePromise<Invoice> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/invoice',
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
    /**
     * Get invoice details
     * @param id Invoice ID
     * @param authorization
     * @returns Invoice Invoice details retrieved successfully
     * @throws ApiError
     */
    public static getInvoice(
        id: string,
        authorization: string,
    ): CancelablePromise<Invoice> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/invoice/{id}',
            path: {
                'id': id,
            },
            headers: {
                'Authorization': authorization,
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
     * Process invoice payment webhook
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static invoiceWebhook(
        requestBody?: {
            id: string;
            amount: string;
            description: string;
            status: InvoiceStatus;
            pay_to_address: string;
            paid_by_address?: string;
            date_change: number;
            date_expire: number;
            date_create: number;
        },
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
}
