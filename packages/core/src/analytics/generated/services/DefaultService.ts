/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnalyticsEvent } from '../models/AnalyticsEvent';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * List analytics events (schema preview)
     * Schema-only operation to render models in Swagger UI.
     * @returns AnalyticsEvent OK
     * @throws ApiError
     */
    public static getEvents(): CancelablePromise<Array<AnalyticsEvent>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/events',
        });
    }
}
