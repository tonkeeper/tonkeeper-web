/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TradeService {
    /**
     * @param from
     * @param to
     * @param amount
     * @param provider
     * @returns any Default Response
     * @throws ApiError
     */
    public static calculateTrade(
        from: string,
        to: string,
        amount: string,
        provider: ('dedust' | 'stonfi'),
    ): CancelablePromise<({
        type: 'dedust';
        trades: Array<Array<{
            pool: {
                address: string;
                isStable: boolean;
                assets: Array<string>;
                reserves: Array<string>;
            };
            assetIn: string;
            assetOut: string;
            tradeFee: string;
            amountIn: string;
            amountOut: string;
        }>>;
    } | {
        type: 'stonfi';
        trade: {
            ask_address: string;
            ask_units: string;
            fee_address: string;
            fee_percent: string;
            fee_units: string;
            min_ask_units: string;
            offer_address: string;
            offer_units: string;
            pool_address: string;
            price_impact: string;
            router_address: string;
            slippage_tolerance: string;
            swap_rate: string;
        } | null;
    })> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/trade/calculate',
            query: {
                'from': from,
                'to': to,
                'amount': amount,
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
    public static encodeTrade(
        requestBody: {
            swap: ({
                type: 'dedust';
                trade: Array<{
                    pool: {
                        address: string;
                    };
                    assetIn: string;
                    assetOut: string;
                    amountIn: string;
                    amountOut: string;
                }>;
            } | {
                type: 'stonfi';
                trade: {
                    ask_address: string;
                    ask_units: string;
                    offer_address: string;
                    offer_units: string;
                };
            });
            execParams: {
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
            url: '/api/v1/trade/encode',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                500: `Default Response`,
            },
        });
    }
}
