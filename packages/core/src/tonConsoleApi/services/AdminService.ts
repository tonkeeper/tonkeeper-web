/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Ok } from '../models/Ok';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * Private method: Get project balance
     * @param id Project ID
     * @returns any Project balance
     * @throws ApiError
     */
    public static adminGetProjectBalance(
        id: number,
    ): CancelablePromise<{
        balance: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/project/{id}/balance',
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
     * Private method: Charge project
     * Private method
     * @param id Project ID
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static adminChargeProject(
        id: number,
        requestBody?: {
            amount: number;
            type_of_charge: string;
            info: any;
        },
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/project/{id}/charge',
            path: {
                'id': id,
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
     * Private method: Messages charge project
     * Private method
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static adminMessagesChargeProject(
        requestBody?: {
            app_id: number;
            success_delivery: number;
            message: string;
            addresses?: Array<string>;
        },
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/messages/charge',
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
