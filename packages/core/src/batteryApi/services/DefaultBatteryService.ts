/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AndroidBatteryPurchaseStatus } from '../models/AndroidBatteryPurchaseStatus';
import type { appStoreResponse } from '../models/appStoreResponse';
import type { Balance } from '../models/Balance';
import type { Config } from '../models/Config';
import type { GaslessEstimation } from '../models/GaslessEstimation';
import type { iOSBatteryPurchaseStatus } from '../models/iOSBatteryPurchaseStatus';
import type { promoCodeBatteryPurchaseStatus } from '../models/promoCodeBatteryPurchaseStatus';
import type { Purchases } from '../models/Purchases';
import type { RechargeMethods } from '../models/RechargeMethods';
import type { Status } from '../models/Status';
import type { Transactions } from '../models/Transactions';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class DefaultBatteryService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * This method returns information about the current status of Battery Service.
     * @param xTonConnectAuth
     * @returns Status TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public getStatus(
        xTonConnectAuth: string,
    ): CancelablePromise<Status | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/status',
            headers: {
                'X-TonConnect-Auth': xTonConnectAuth,
            },
        });
    }
    /**
     * This method returns information about Battery Service.
     * @returns Config TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public getConfig(): CancelablePromise<Config | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/config',
        });
    }
    /**
     * This method returns information about a user's balance.
     * @param xTonConnectAuth
     * @param units
     * @returns Balance TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public getBalance(
        xTonConnectAuth: string,
        units: 'usd' | 'ton' = 'usd',
    ): CancelablePromise<Balance | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/balance',
            headers: {
                'X-TonConnect-Auth': xTonConnectAuth,
            },
            query: {
                'units': units,
            },
        });
    }
    /**
     * Send message to blockchain
     * @param xTonConnectAuth
     * @param requestBody bag-of-cells serialized to base64
     * @returns any success
     * @throws ApiError
     */
    public sendMessage(
        xTonConnectAuth: string,
        requestBody: {
            boc: string;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/message',
            headers: {
                'X-TonConnect-Auth': xTonConnectAuth,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * verify an in-app purchase
     * @param xTonConnectAuth
     * @param requestBody In-App purchase
     * @returns AndroidBatteryPurchaseStatus TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public androidBatteryPurchase(
        xTonConnectAuth: string,
        requestBody: {
            purchases: Array<{
                token: string;
                product_id: string;
                promo?: string;
            }>;
        },
    ): CancelablePromise<AndroidBatteryPurchaseStatus | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/purchase-battery/android',
            headers: {
                'X-TonConnect-Auth': xTonConnectAuth,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns appStoreResponse TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public appStoreNotification(
        requestBody: {
            signedPayload: string;
        },
    ): CancelablePromise<appStoreResponse | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/purchase-battery/ios/app-store-notification',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * verify an in-app purchase
     * @param xTonConnectAuth
     * @param requestBody In-App purchase
     * @returns iOSBatteryPurchaseStatus TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public iosBatteryPurchase(
        xTonConnectAuth: string,
        requestBody: {
            transactions: Array<{
                id: string;
                promo?: string;
            }>;
        },
    ): CancelablePromise<iOSBatteryPurchaseStatus | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/purchase-battery/ios',
            headers: {
                'X-TonConnect-Auth': xTonConnectAuth,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * charge battery with promo code
     * @param xTonConnectAuth
     * @param requestBody charge battery with promo code
     * @param acceptLanguage
     * @returns promoCodeBatteryPurchaseStatus TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public promoCodeBatteryPurchase(
        xTonConnectAuth: string,
        requestBody: {
            promo_code: string;
        },
        acceptLanguage: string = 'en',
    ): CancelablePromise<promoCodeBatteryPurchaseStatus | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/purchase-battery/promo-code',
            headers: {
                'Accept-Language': acceptLanguage,
                'X-TonConnect-Auth': xTonConnectAuth,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param promo
     * @returns any all good
     * @throws ApiError
     */
    public verifyPurchasePromo(
        promo?: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/purchase-battery/verify-purchase-promo',
            query: {
                'promo': promo,
            },
        });
    }
    /**
     * This method returns on-chain recharge methods.
     * @param includeRechargeOnly
     * @returns RechargeMethods TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public getRechargeMethods(
        includeRechargeOnly: boolean = true,
    ): CancelablePromise<RechargeMethods | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/recharge-methods',
            query: {
                'include_recharge_only': includeRechargeOnly,
            },
        });
    }
    /**
     * @param xTonConnectAuth
     * @param requestBody
     * @returns any success
     * @throws ApiError
     */
    public requestRefund(
        xTonConnectAuth: string,
        requestBody: {
            /**
             * @deprecated
             */
            user_purchase_id?: number;
            purchase_id?: number;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/request-refund',
            headers: {
                'X-TonConnect-Auth': xTonConnectAuth,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * This method returns a list of purchases made by a specific user.
     * @param xTonConnectAuth
     * @param limit
     * @param offset
     * @param includeGiftsOnTheWay
     * @returns Purchases TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public getPurchases(
        xTonConnectAuth: string,
        limit: number = 1000,
        offset?: number,
        includeGiftsOnTheWay: boolean = false,
    ): CancelablePromise<Purchases | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/purchases',
            headers: {
                'X-TonConnect-Auth': xTonConnectAuth,
            },
            query: {
                'limit': limit,
                'offset': offset,
                'include_gifts_on_the_way': includeGiftsOnTheWay,
            },
        });
    }
    /**
     * This method returns a list of transactions made by a specific user.
     * @param xTonConnectAuth
     * @param limit
     * @param offset
     * @returns Transactions TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public getTransactions(
        xTonConnectAuth: string,
        limit: number = 1000,
        offset?: number,
    ): CancelablePromise<Transactions | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/transactions',
            headers: {
                'X-TonConnect-Auth': xTonConnectAuth,
            },
            query: {
                'limit': limit,
                'offset': offset,
            },
        });
    }
    /**
     * @param jettonMaster
     * @param requestBody
     * @param xTonConnectAuth
     * @param walletAddress
     * @param walletPublicKey
     * @returns GaslessEstimation TBD
     * @returns any Some error during request processing
     * @throws ApiError
     */
    public estimateGaslessCost(
        jettonMaster: string,
        requestBody: {
            battery?: boolean;
            payload: string;
        },
        xTonConnectAuth?: string,
        walletAddress?: string,
        walletPublicKey?: string,
    ): CancelablePromise<GaslessEstimation | {
        error: string;
        'error-key'?: string;
        'error-details'?: string;
    }> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/gasless/estimate-cost/{jetton_master}',
            path: {
                'jetton_master': jettonMaster,
            },
            headers: {
                'X-TonConnect-Auth': xTonConnectAuth,
            },
            query: {
                'wallet_address': walletAddress,
                'wallet_public_key': walletPublicKey,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param token
     * @param requestBody
     * @returns any all good
     * @throws ApiError
     */
    public createCustomRefund(
        token: string,
        requestBody: {
            relayer_event_id?: number;
            amount: string;
            currency: string;
            comment: string;
            reason: string;
            destination: string;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/restricted/create-custom-refund',
            query: {
                'token': token,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param token
     * @param userId
     * @param requestBody
     * @returns any all good
     * @throws ApiError
     */
    public resetUserBalance(
        token: string,
        userId: number,
        requestBody: {
            reason: string;
        },
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/restricted/users/{user_id}/reset-balance',
            path: {
                'user_id': userId,
            },
            query: {
                'token': token,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param token
     * @param purchaseId
     * @returns any all good
     * @throws ApiError
     */
    public extendRefundPeriod(
        token: string,
        purchaseId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/restricted/purchases/{purchase_id}/extend-refund-period',
            path: {
                'purchase_id': purchaseId,
            },
            query: {
                'token': token,
            },
        });
    }
}
