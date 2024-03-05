/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessagesApp } from '../models/MessagesApp';
import type { MessagesPackage } from '../models/MessagesPackage';
import type { Ok } from '../models/Ok';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MessagesServiceService {
    /**
     * Get messages packages
     * @returns any Messages packages
     * @throws ApiError
     */
    public static getMessagesPackages(): CancelablePromise<{
        items: Array<MessagesPackage>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/messages/packages',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Buy messages package
     * @param projectId Project ID
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static buyMessagesPackage(
        projectId: number,
        requestBody?: {
            id: number;
        },
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/messages/package',
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
     * Create project messages app
     * @param projectId Project ID
     * @param requestBody Data that is expected
     * @returns any Messages app has been created
     * @throws ApiError
     */
    public static createProjectMessagesApp(
        projectId: number,
        requestBody?: {
            url: string;
            name: string;
            image?: string;
        },
    ): CancelablePromise<{
        payload: string;
        valid_until: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/messages/app',
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
     * Delete project messages app
     * @param appId App ID
     * @returns Ok Ok
     * @throws ApiError
     */
    public static deleteProjectMessagesApp(
        appId: number,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/services/messages/app',
            query: {
                'app_id': appId,
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
     * Verify project messages app
     * @param projectId Project ID
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static verifyProjectMessagesApp(
        projectId: number,
        requestBody?: {
            payload: string;
        },
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/messages/app/verify',
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
     * Get project messages apps
     * @param projectId Project ID
     * @returns any Project messages apps
     * @throws ApiError
     */
    public static getProjectMessagesApps(
        projectId: number,
    ): CancelablePromise<{
        items: Array<MessagesApp>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/messages/apps',
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
     * Get project messages balance
     * @param projectId Project ID
     * @returns any Project messages balance
     * @throws ApiError
     */
    public static getProjectMessagesBalance(
        projectId: number,
    ): CancelablePromise<{
        balance: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/messages/balance',
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
     * Get project messages app token
     * @param appId App ID
     * @returns any Project messages app token
     * @throws ApiError
     */
    public static getProjectMessagesAppToken(
        appId: number,
    ): CancelablePromise<{
        token: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/messages/token',
            query: {
                'app_id': appId,
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
     * Regenerate project messages app token
     * @param appId App ID
     * @returns any Project messages app token
     * @throws ApiError
     */
    public static regenerateProjectMessagesAppToken(
        appId: number,
    ): CancelablePromise<{
        token: string;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/messages/token',
            query: {
                'app_id': appId,
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
     * Get project messages stats
     * @param appId App ID
     * @returns any Project messages stats
     * @throws ApiError
     */
    public static getProjectMessagesStats(
        appId: number,
    ): CancelablePromise<{
        stats: {
            users: number;
            sent_in_week: number;
            enable_notifications: number;
            available_messages: number;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/messages/stats',
            query: {
                'app_id': appId,
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
     * Send project messages push
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static sendProjectMessagesPush(
        requestBody?: {
            title?: string;
            message: string;
            /**
             * Link for user action, the link will open in Tonkeeper dApp Browser
             */
            link?: string;
            addresses?: Array<string>;
            /**
             * If the address has not been transmitted, then push messages will be sent to all users
             */
            address?: string;
        },
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/messages/push',
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
