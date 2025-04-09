/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Ok } from '../models/Ok';
import type { TonSite } from '../models/TonSite';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TonSitesServiceService {
    /**
     * Create a Ton Site
     * @param projectId Project ID
     * @param requestBody Data that is expected
     * @returns any Created Ton Site
     * @throws ApiError
     */
    public static createTonSite(
        projectId: number,
        requestBody?: {
            domain: string;
        },
    ): CancelablePromise<{
        site: TonSite;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/sites',
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
     * Get Ton Sites
     * @param projectId Project ID
     * @returns any Ton Sites
     * @throws ApiError
     */
    public static getTonSites(
        projectId: number,
    ): CancelablePromise<{
        items: Array<TonSite>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/sites',
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
     * Delete the Ton Site
     * @param projectId Project ID
     * @param id Site ID
     * @returns Ok Ok
     * @throws ApiError
     */
    public static deleteTonSite(
        projectId: number,
        id: string,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/services/sites/{id}',
            path: {
                'id': id,
            },
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
     * Add endpoints to the Ton Site
     * @param projectId Project ID
     * @param id Site ID
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static updateTonSitesEndpoints(
        projectId: number,
        id: string,
        requestBody?: Array<string>,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/sites/{id}/endpoints',
            path: {
                'id': id,
            },
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
}
