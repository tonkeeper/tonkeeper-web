/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class WalletBatteryService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Account verification and token issuance
     * @param requestBody Data that is expected from TON Connect
     * @returns any auth token
     * @throws ApiError
     */
    public tonConnectProof(
        requestBody: {
            address: string;
            proof: {
                timestamp: number;
                domain: {
                    length_bytes?: number;
                    value: string;
                };
                signature: string;
                payload: string;
                state_init?: string;
            };
        },
    ): CancelablePromise<{
        token: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/tonconnect/proof',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
