/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { InvoiceFieldOrder } from '../models/InvoiceFieldOrder';
import type { InvoicesApp } from '../models/InvoicesApp';
import type { InvoicesInvoice } from '../models/InvoicesInvoice';
import type { InvoiceStatus } from '../models/InvoiceStatus';
import type { Ok } from '../models/Ok';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InvoicesServiceService {
    /**
     * Create invoices app
     * @param projectId Project ID
     * @param requestBody Data that is expected
     * @returns any Invoices app
     * @throws ApiError
     */
    public static createInvoicesApp(
        projectId: number,
        requestBody?: {
            name: string;
            description?: string;
            webhooks?: Array<string>;
            recipient_address: string;
        },
    ): CancelablePromise<{
        app: InvoicesApp;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/invoices/app',
            query: {
                'project_id': projectId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get invoices app by project
     * @param projectId Project ID
     * @returns any Invoices app
     * @throws ApiError
     */
    public static getInvoicesApp(
        projectId: number,
    ): CancelablePromise<{
        app: InvoicesApp;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/invoices/app',
            query: {
                'project_id': projectId,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Update invoices app
     * @param id App ID
     * @param requestBody Data that is expected
     * @returns any Invoices app
     * @throws ApiError
     */
    public static updateInvoicesApp(
        id: number,
        requestBody?: {
            name?: string;
            description?: string;
            recipient_address?: string;
        },
    ): CancelablePromise<{
        app: InvoicesApp;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/invoices/app/{id}',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Delete invoices app
     * @param id App ID
     * @returns Ok Ok
     * @throws ApiError
     */
    public static deleteInvoicesApp(
        id: number,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/services/invoices/app/{id}',
            path: {
                'id': id,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Create webhook for app
     * @param id App ID
     * @param requestBody Data that is expected
     * @returns any Invoices app
     * @throws ApiError
     */
    public static createInvoicesAppWebhook(
        id: number,
        requestBody?: {
            webhook: string;
        },
    ): CancelablePromise<{
        app: InvoicesApp;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/invoices/app/{id}/webhook',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Update webhook for app
     * @param id App ID
     * @param webhookId Webhook ID
     * @param requestBody Data that is expected
     * @returns any Invoices app
     * @throws ApiError
     */
    public static updateInvoicesAppWebhook(
        id: number,
        webhookId: string,
        requestBody?: {
            webhook: string;
        },
    ): CancelablePromise<{
        app: InvoicesApp;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/invoices/app/{id}/webhook/{webhook_id}',
            path: {
                'id': id,
                'webhook_id': webhookId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Delete webhook for app
     * @param id App ID
     * @param webhookId Webhook ID
     * @returns any Invoices app
     * @throws ApiError
     */
    public static deleteInvoicesAppWebhook(
        id: number,
        webhookId: string,
    ): CancelablePromise<{
        app: InvoicesApp;
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/services/invoices/app/{id}/webhook/{webhook_id}',
            path: {
                'id': id,
                'webhook_id': webhookId,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get invoices app token
     * @param appId App ID
     * @returns any Invoices app token
     * @throws ApiError
     */
    public static getInvoicesAppToken(
        appId: number,
    ): CancelablePromise<{
        token: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/invoices/token',
            query: {
                'app_id': appId,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Regenerate invoices app token
     * @param appId App ID
     * @returns any Invoices app token
     * @throws ApiError
     */
    public static regenerateInvoicesAppToken(
        appId: number,
    ): CancelablePromise<{
        token: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/invoices/token',
            query: {
                'app_id': appId,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Create invoice
     * @param appId App ID
     * @param requestBody Data that is expected
     * @returns InvoicesInvoice Service invoices fee
     * @throws ApiError
     */
    public static createInvoicesInvoice(
        appId?: number,
        requestBody?: {
            /**
             * nano ton are expected
             */
            amount: string;
            /**
             * seconds are expected
             */
            life_time: number;
            description?: string;
        },
    ): CancelablePromise<InvoicesInvoice> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/invoices/invoice',
            query: {
                'app_id': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get invoices
     * @param appId App ID
     * @param limit Limit
     * @param offset Offset
     * @param fieldOrder Field
     * @param typeOrder Type order
     * @param searchId Search ID
     * @param filterStatus Filter status
     * @param overpayment Overpayment
     * @param start Start date
     * @param end End date
     * @returns any Invoices
     * @throws ApiError
     */
    public static getInvoices(
        appId: number,
        limit: number = 100,
        offset?: number,
        fieldOrder?: InvoiceFieldOrder,
        typeOrder?: 'asc' | 'desc',
        searchId?: string,
        filterStatus?: Array<InvoiceStatus>,
        overpayment: boolean = false,
        start?: number,
        end?: number,
    ): CancelablePromise<{
        items: Array<InvoicesInvoice>;
        count: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/invoices',
            query: {
                'app_id': appId,
                'limit': limit,
                'offset': offset,
                'field_order': fieldOrder,
                'type_order': typeOrder,
                'search_id': searchId,
                'filter_status': filterStatus,
                'overpayment': overpayment,
                'start': start,
                'end': end,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get invoice
     * @param id Invoice ID
     * @param appId App ID
     * @returns InvoicesInvoice Service invoices fee
     * @throws ApiError
     */
    public static getInvoicesInvoice(
        id: string,
        appId?: number,
    ): CancelablePromise<InvoicesInvoice> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/invoices/{id}',
            path: {
                'id': id,
            },
            query: {
                'app_id': appId,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Update invoice
     * @param id Invoice ID
     * @param appId App ID
     * @param requestBody Data that is expected
     * @returns InvoicesInvoice Service invoices fee
     * @throws ApiError
     */
    public static updateInvoicesInvoice(
        id: string,
        appId: number,
        requestBody?: {
            refund_amount?: number;
            refunded?: boolean;
        },
    ): CancelablePromise<InvoicesInvoice> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/invoices/{id}',
            path: {
                'id': id,
            },
            query: {
                'app_id': appId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Cancel invoice
     * @param id Invoice ID
     * @param appId App ID
     * @returns InvoicesInvoice Service invoices fee
     * @throws ApiError
     */
    public static cancelInvoicesInvoice(
        id: string,
        appId: number,
    ): CancelablePromise<InvoicesInvoice> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/invoices/{id}/cancel',
            path: {
                'id': id,
            },
            query: {
                'app_id': appId,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get invoices stats
     * @param appId App ID
     * @returns any Invoices stats
     * @throws ApiError
     */
    public static getInvoicesStats(
        appId: number,
    ): CancelablePromise<{
        stats: {
            total: number;
            success_total: number;
            success_in_week: number;
            invoices_in_progress: number;
            total_amount_pending: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/invoices/stats',
            query: {
                'app_id': appId,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Export invoices to csv file
     * @param appId App ID
     * @param fieldOrder Field
     * @param typeOrder Type order
     * @param searchId Search ID
     * @param filterStatus Filter status
     * @param overpayment Overpayment
     * @param start Start date
     * @param end End date
     * @returns binary Invoices CSV
     * @throws ApiError
     */
    public static exportInvoicesCsv(
        appId: number,
        fieldOrder?: InvoiceFieldOrder,
        typeOrder?: 'asc' | 'desc',
        searchId?: string,
        filterStatus?: Array<InvoiceStatus>,
        overpayment: boolean = false,
        start?: number,
        end?: number,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/invoices/export',
            query: {
                'app_id': appId,
                'field_order': fieldOrder,
                'type_order': typeOrder,
                'search_id': searchId,
                'filter_status': filterStatus,
                'overpayment': overpayment,
                'start': start,
                'end': end,
            },
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
}
