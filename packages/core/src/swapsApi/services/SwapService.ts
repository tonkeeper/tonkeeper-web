/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SwapService {
    /**
     * @param fromAsset
     * @param toAsset
     * @param fromAmount
     * @param provider
     * @param referral
     * @returns any Default Response
     * @throws ApiError
     */
    public static calculateSwap(
        fromAsset: string,
        toAsset: string,
        fromAmount: string,
        provider: ('dedust' | 'stonfi'),
        referral?: string,
    ): CancelablePromise<({
        provider: 'stonfi';
        trades: Array<({
            fromAsset: string;
            toAsset: string;
            fromAmount: string;
            toAmount: string;
            blockchainFee: string;
            path: Array<string>;
        } & {
            stonfiRawTrade: {
                fromAsset: string;
                toAsset: string;
                fromAmount: string;
                toAmount: string;
            };
        })>;
    } | {
        provider: 'dedust';
        trades: Array<({
            fromAsset: string;
            toAsset: string;
            fromAmount: string;
            toAmount: string;
            blockchainFee: string;
            path: Array<string>;
        } & {
            dedustRawTrade: Array<{
                fromAsset: string;
                toAsset: string;
                fromAmount: string;
                toAmount: string;
                poolAddress: string;
            }>;
        })>;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v2/swap/calculate',
            query: {
                'fromAsset': fromAsset,
                'toAsset': toAsset,
                'fromAmount': fromAmount,
                'referral': referral,
                'provider': provider,
            },
            errors: {
                500: `Default Response`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns any Default Response
     * @throws ApiError
     */
    public static encodeSwap(
        requestBody: {
            swap: ({
                provider: 'dedust';
                dedustTrade: Array<{
                    fromAsset: string;
                    toAsset: string;
                    fromAmount: string;
                    toAmount: string;
                    poolAddress: string;
                }>;
            } | {
                provider: 'stonfi';
                stonfiTrade: {
                    fromAsset: string;
                    toAsset: string;
                    fromAmount: string;
                    toAmount: string;
                };
            });
            options: {
                senderAddress: string;
                referralAddress?: string;
                slippage: string;
            };
        },
    ): CancelablePromise<{
        value: string;
        to: string;
        body: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/v2/swap/encode',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Default Response`,
            },
        });
    }
    /**
     * @returns any Default Response
     * @throws ApiError
     */
    public static swapGas(): CancelablePromise<{
        dedust: {
            tonToJetton: string;
            jettonToTon: string;
            jettonToJetton: string;
        };
        stonfi: {
            tonToJetton: string;
            jettonToTon: string;
            jettonToJetton: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v2/swap/gas',
            errors: {
                500: `Default Response`,
            },
        });
    }
    /**
     * @returns any Default Response
     * @throws ApiError
     */
    public static swapAssets(): CancelablePromise<Array<{
        symbol: string;
        name: string;
        decimals: number;
        address: string;
        image: string;
    }>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/v2/swap/assets',
            errors: {
                500: `Default Response`,
            },
        });
    }
}
