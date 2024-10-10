/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class EmulationBatteryService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Emulate sending message to blockchain
     * @param xTonConnectAuth
     * @param requestBody bag-of-cells serialized to base64
     * @param acceptLanguage
     * @returns any emulated message
     * @throws ApiError
     */
    public emulateMessageToWallet(
        xTonConnectAuth: string,
        requestBody: {
            boc: string;
        },
        acceptLanguage: string = 'en',
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/wallet/emulate',
            headers: {
                'Accept-Language': acceptLanguage,
                'X-TonConnect-Auth': xTonConnectAuth,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param name
     * @returns any
     * @throws ApiError
     */
    public getJettonMetadata(
        name: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/jetton-metadata/{name}.json',
            path: {
                'name': name,
            },
        });
    }
}
