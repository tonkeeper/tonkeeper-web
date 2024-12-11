/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Balance } from '../models/Balance';
import type { Charge } from '../models/Charge';
import type { Deposit } from '../models/Deposit';
import type { Ok } from '../models/Ok';
import type { Participant } from '../models/Participant';
import type { Project } from '../models/Project';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ProjectService {
    /**
     * Create project
     * @param formData Data that is expected
     * @returns any Project
     * @throws ApiError
     */
    public static createProject(
        formData?: {
            name: string;
            image?: Blob;
        },
    ): CancelablePromise<{
        project: Project;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project',
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
     * Get user's project
     * @returns any User projects
     * @throws ApiError
     */
    public static getProjects(): CancelablePromise<{
        items: Array<Project>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/projects',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Update user project
     * You need to pass only those fields that need to be changed.
     * @param id Project ID
     * @param formData Data that is expected
     * @returns any Project
     * @throws ApiError
     */
    public static updateProject(
        id: number,
        formData?: {
            name?: string;
            image?: Blob;
            remove_image?: boolean;
        },
    ): CancelablePromise<{
        project: Project;
    }> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/project/{id}',
            path: {
                'id': id,
            },
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
     * Delete user project
     * @param id Project ID
     * @returns Ok Ok
     * @throws ApiError
     */
    public static deleteProject(
        id: number,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/project/{id}',
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
     * Get project deposit address
     * @param id Project ID
     * @returns any Deposit wallet
     * @throws ApiError
     */
    public static getDepositAddress(
        id: number,
    ): CancelablePromise<{
        ton_deposit_wallet: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/project/{id}/deposit/address',
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
     * Get project deposits history
     * @param id Project ID
     * @returns any Deposits history
     * @throws ApiError
     */
    public static getProjectDepositsHistory(
        id: number,
    ): CancelablePromise<{
        balance: Balance;
        history: Array<Deposit>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/project/{id}/deposits/history',
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
     * Crediting funds with a promo code
     * @param id Project ID
     * @param promoCode Promo code
     * @returns Ok Ok
     * @throws ApiError
     */
    public static promoCodeDepositProject(
        id: number,
        promoCode: string,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/{id}/promocode/{promo_code}',
            path: {
                'id': id,
                'promo_code': promoCode,
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
     * Get project payments history
     * @param id Project ID
     * @param offset Offset
     * @param limit Limit
     * @returns any Project payments history
     * @throws ApiError
     */
    public static projectPaymentsHistory(
        id: number,
        offset?: number,
        limit: number = 100,
    ): CancelablePromise<{
        count: number;
        history: Array<Charge>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/project/{id}/payments/history',
            path: {
                'id': id,
            },
            query: {
                'offset': offset,
                'limit': limit,
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
     * Get project participants
     * @param id Project ID
     * @returns any List of project participants
     * @throws ApiError
     */
    public static getProjectParticipants(
        id: number,
    ): CancelablePromise<{
        items: Array<Participant>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/project/{id}/participants',
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
     * Add a participant to the project
     * @param id Project ID
     * @param requestBody Data that is expected
     * @returns any Participant
     * @throws ApiError
     */
    public static addProjectParticipant(
        id: number,
        requestBody?: {
            user_id: number;
        },
    ): CancelablePromise<{
        participant: Participant;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/project/{id}/participants',
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
     * Delete a participant from the project
     * @param id Project ID
     * @param userId User ID
     * @returns Ok Ok
     * @throws ApiError
     */
    public static deleteProjectParticipant(
        id: number,
        userId: number,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/project/{id}/participant/{user_id}',
            path: {
                'id': id,
                'user_id': userId,
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
