/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class ConnectBatteryService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Get a payload for further token receipt
     * @returns any payload
     * @throws ApiError
     */
    public getTonConnectPayload(): CancelablePromise<{
        payload: string;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/tonconnect/payload',
        });
    }
}
