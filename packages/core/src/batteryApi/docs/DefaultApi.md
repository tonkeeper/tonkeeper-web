# DefaultApi

All URIs are relative to *https://battery.tonkeeper.com*

| Method                                                                                    | HTTP request                                                      | Description                                                         |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| [**androidBatteryPurchase**](DefaultApi.md#androidbatterypurchaseoperation)               | **POST** /purchase-battery/android                                |                                                                     |
| [**appStoreNotification**](DefaultApi.md#appstorenotificationoperation)                   | **POST** /purchase-battery/ios/app-store-notification             |                                                                     |
| [**applyPromo**](DefaultApi.md#applypromooperation)                                       | **POST** /restricted/apply-promo                                  |                                                                     |
| [**batteryNftTransfer**](DefaultApi.md#batterynfttransferoperation)                       | **POST** /restricted/battery-nft-transfer                         |                                                                     |
| [**batterySwapTonToUsdt**](DefaultApi.md#batteryswaptontousdtoperation)                   | **POST** /restricted/battery-swap-ton-to-usdt                     |                                                                     |
| [**batteryTransfer**](DefaultApi.md#batterytransferoperation)                             | **POST** /restricted/battery-transfer                             |                                                                     |
| [**createCustomRefund**](DefaultApi.md#createcustomrefundoperation)                       | **POST** /restricted/create-custom-refund                         |                                                                     |
| [**createPromoCampaign**](DefaultApi.md#createpromocampaignoperation)                     | **POST** /restricted/promo-campaign                               |                                                                     |
| [**createPromoCampaignByUser**](DefaultApi.md#createpromocampaignbyuseroperation)         | **POST** /restricted/promo-campaign-by-user                       |                                                                     |
| [**enterpriseEstimate**](DefaultApi.md#enterpriseestimateoperation)                       | **POST** /enterprise/wallets/{wallet_id}/estimate                 |                                                                     |
| [**enterpriseGetMessage**](DefaultApi.md#enterprisegetmessage)                            | **GET** /enterprise/messages/{msg_id}                             |                                                                     |
| [**enterpriseGetStatus**](DefaultApi.md#enterprisegetstatus)                              | **GET** /enterprise/status                                        |                                                                     |
| [**enterpriseGetWalletConfig**](DefaultApi.md#enterprisegetwalletconfig)                  | **GET** /enterprise/wallets/{wallet_id}/config                    |                                                                     |
| [**enterpriseSend**](DefaultApi.md#enterprisesend)                                        | **POST** /enterprise/wallets/{wallet_id}/send                     |                                                                     |
| [**estimateGaslessCost**](DefaultApi.md#estimategaslesscostoperation)                     | **POST** /gasless/estimate-cost/{jetton_master}                   |                                                                     |
| [**estimateGaslessJettonTransfer**](DefaultApi.md#estimategaslessjettontransferoperation) | **POST** /gasless/estimate/jetton-transfer                        | Estimate gasless commission for a jetton transfer by its parameters |
| [**extendRefundPeriod**](DefaultApi.md#extendrefundperiod)                                | **POST** /restricted/purchases/{purchase_id}/extend-refund-period |                                                                     |
| [**getBalance**](DefaultApi.md#getbalance)                                                | **GET** /balance                                                  |                                                                     |
| [**getBatteryCharged**](DefaultApi.md#getbatterycharged)                                  | **GET** /battery-charged                                          |                                                                     |
| [**getConfig**](DefaultApi.md#getconfig)                                                  | **GET** /config                                                   |                                                                     |
| [**getPromoUsed**](DefaultApi.md#getpromoused)                                            | **GET** /promo-used                                               |                                                                     |
| [**getPurchases**](DefaultApi.md#getpurchases)                                            | **GET** /purchases                                                |                                                                     |
| [**getRechargeMethods**](DefaultApi.md#getrechargemethods)                                | **GET** /recharge-methods                                         |                                                                     |
| [**getStatus**](DefaultApi.md#getstatus)                                                  | **GET** /status                                                   |                                                                     |
| [**getTransactions**](DefaultApi.md#gettransactions)                                      | **GET** /transactions                                             |                                                                     |
| [**getTronAvailableTransfers**](DefaultApi.md#gettronavailabletransfers)                  | **GET** /v0/tron/available-transfers                              |                                                                     |
| [**getTronConfig**](DefaultApi.md#gettronconfig)                                          | **GET** /v0/tron/config                                           |                                                                     |
| [**getTronTransactions**](DefaultApi.md#gettrontransactions)                              | **GET** /v0/tron/transactions                                     |                                                                     |
| [**increaseUserBalance**](DefaultApi.md#increaseuserbalanceoperation)                     | **POST** /restricted/users/{user_id}/increase-balance             |                                                                     |
| [**iosBatteryPurchase**](DefaultApi.md#iosbatterypurchaseoperation)                       | **POST** /purchase-battery/ios                                    |                                                                     |
| [**itrxIoCallback**](DefaultApi.md#itrxiocallback)                                        | **POST** /v0/tron/itrx-io-callback                                |                                                                     |
| [**migrateOldBattery**](DefaultApi.md#migrateoldbatteryoperation)                         | **POST** /restricted/migrate-old-battery                          |                                                                     |
| [**migrateRelayer**](DefaultApi.md#migraterelayeroperation)                               | **POST** /restricted/migrate-relayer                              |                                                                     |
| [**omnistonSwap**](DefaultApi.md#omnistonswap)                                            | **POST** /restricted/omniston-swap                                |                                                                     |
| [**promoCodeBatteryPurchase**](DefaultApi.md#promocodebatterypurchaseoperation)           | **POST** /purchase-battery/promo-code                             |                                                                     |
| [**relayerToBattery**](DefaultApi.md#relayertobatteryoperation)                           | **POST** /restricted/relayer-to-battery                           |                                                                     |
| [**replenishOKXBalance**](DefaultApi.md#replenishokxbalanceoperation)                     | **POST** /restricted/okx-deposit                                  |                                                                     |
| [**requestRefund**](DefaultApi.md#requestrefundoperation)                                 | **POST** /request-refund                                          |                                                                     |
| [**resetUserBalance**](DefaultApi.md#resetuserbalanceoperation)                           | **POST** /restricted/users/{user_id}/reset-balance                |                                                                     |
| [**sendMessage**](DefaultApi.md#sendmessageoperation)                                     | **POST** /message                                                 |                                                                     |
| [**tronEstimate**](DefaultApi.md#tronestimate)                                            | **GET** /v0/tron/estimate                                         |                                                                     |
| [**tronSend**](DefaultApi.md#tronsendoperation)                                           | **POST** /v0/tron/send                                            |                                                                     |
| [**verifyPurchasePromo**](DefaultApi.md#verifypurchasepromo)                              | **GET** /purchase-battery/verify-purchase-promo                   |                                                                     |

## androidBatteryPurchase

> AndroidBatteryPurchaseStatus androidBatteryPurchase(androidBatteryPurchaseRequest,
> xTonConnectAuth, xWalletID, authorization)

verify an in-app purchase

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { AndroidBatteryPurchaseOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // AndroidBatteryPurchaseRequest | In-App purchase
    androidBatteryPurchaseRequest: ...,
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
  } satisfies AndroidBatteryPurchaseOperationRequest;

  try {
    const data = await api.androidBatteryPurchase(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                              | Type                                                              | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **androidBatteryPurchaseRequest** | [AndroidBatteryPurchaseRequest](AndroidBatteryPurchaseRequest.md) | In-App purchase                                                                                                                                                                                                                                                                                                                                                                                        |                                      |
| **xTonConnectAuth**               | `string`                                                          |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**                     | `string`                                                          | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**                 | `string`                                                          | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |

### Return type

[**AndroidBatteryPurchaseStatus**](AndroidBatteryPurchaseStatus.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## appStoreNotification

> object appStoreNotification(appStoreNotificationRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { AppStoreNotificationOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // AppStoreNotificationRequest
    appStoreNotificationRequest: ...,
  } satisfies AppStoreNotificationOperationRequest;

  try {
    const data = await api.appStoreNotification(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                            | Type                                                          | Description | Notes |
| ------------------------------- | ------------------------------------------------------------- | ----------- | ----- |
| **appStoreNotificationRequest** | [AppStoreNotificationRequest](AppStoreNotificationRequest.md) |             |       |

### Return type

**object**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## applyPromo

> PromoCodeBatteryPurchaseStatus applyPromo(token, applyPromoRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { ApplyPromoOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // ApplyPromoRequest
    applyPromoRequest: ...,
  } satisfies ApplyPromoOperationRequest;

  try {
    const data = await api.applyPromo(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                  | Type                                      | Description | Notes                     |
| --------------------- | ----------------------------------------- | ----------- | ------------------------- |
| **token**             | `string`                                  |             | [Defaults to `undefined`] |
| **applyPromoRequest** | [ApplyPromoRequest](ApplyPromoRequest.md) |             |                           |

### Return type

[**PromoCodeBatteryPurchaseStatus**](PromoCodeBatteryPurchaseStatus.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## batteryNftTransfer

> { [key: string]: any; } batteryNftTransfer(token, batteryNftTransferRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { BatteryNftTransferOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // BatteryNftTransferRequest
    batteryNftTransferRequest: ...,
  } satisfies BatteryNftTransferOperationRequest;

  try {
    const data = await api.batteryNftTransfer(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                          | Type                                                      | Description | Notes                     |
| ----------------------------- | --------------------------------------------------------- | ----------- | ------------------------- |
| **token**                     | `string`                                                  |             | [Defaults to `undefined`] |
| **batteryNftTransferRequest** | [BatteryNftTransferRequest](BatteryNftTransferRequest.md) |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## batterySwapTonToUsdt

> { [key: string]: any; } batterySwapTonToUsdt(token, batterySwapTonToUsdtRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { BatterySwapTonToUsdtOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // BatterySwapTonToUsdtRequest
    batterySwapTonToUsdtRequest: ...,
  } satisfies BatterySwapTonToUsdtOperationRequest;

  try {
    const data = await api.batterySwapTonToUsdt(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                            | Type                                                          | Description | Notes                     |
| ------------------------------- | ------------------------------------------------------------- | ----------- | ------------------------- |
| **token**                       | `string`                                                      |             | [Defaults to `undefined`] |
| **batterySwapTonToUsdtRequest** | [BatterySwapTonToUsdtRequest](BatterySwapTonToUsdtRequest.md) |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## batteryTransfer

> { [key: string]: any; } batteryTransfer(token, batteryTransferRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { BatteryTransferOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // BatteryTransferRequest
    batteryTransferRequest: ...,
  } satisfies BatteryTransferOperationRequest;

  try {
    const data = await api.batteryTransfer(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                       | Type                                                | Description | Notes                     |
| -------------------------- | --------------------------------------------------- | ----------- | ------------------------- |
| **token**                  | `string`                                            |             | [Defaults to `undefined`] |
| **batteryTransferRequest** | [BatteryTransferRequest](BatteryTransferRequest.md) |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## createCustomRefund

> { [key: string]: any; } createCustomRefund(token, createCustomRefundRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { CreateCustomRefundOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // CreateCustomRefundRequest
    createCustomRefundRequest: ...,
  } satisfies CreateCustomRefundOperationRequest;

  try {
    const data = await api.createCustomRefund(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                          | Type                                                      | Description | Notes                     |
| ----------------------------- | --------------------------------------------------------- | ----------- | ------------------------- |
| **token**                     | `string`                                                  |             | [Defaults to `undefined`] |
| **createCustomRefundRequest** | [CreateCustomRefundRequest](CreateCustomRefundRequest.md) |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## createPromoCampaign

> CreatePromoCampaign200Response createPromoCampaign(token, createPromoCampaignRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { CreatePromoCampaignOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // CreatePromoCampaignRequest
    createPromoCampaignRequest: ...,
  } satisfies CreatePromoCampaignOperationRequest;

  try {
    const data = await api.createPromoCampaign(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                           | Type                                                        | Description | Notes                     |
| ------------------------------ | ----------------------------------------------------------- | ----------- | ------------------------- |
| **token**                      | `string`                                                    |             | [Defaults to `undefined`] |
| **createPromoCampaignRequest** | [CreatePromoCampaignRequest](CreatePromoCampaignRequest.md) |             |                           |

### Return type

[**CreatePromoCampaign200Response**](CreatePromoCampaign200Response.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | success                              | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## createPromoCampaignByUser

> CreatePromoCampaignByUser200Response createPromoCampaignByUser(token,
> createPromoCampaignByUserRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { CreatePromoCampaignByUserOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // CreatePromoCampaignByUserRequest
    createPromoCampaignByUserRequest: ...,
  } satisfies CreatePromoCampaignByUserOperationRequest;

  try {
    const data = await api.createPromoCampaignByUser(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                                 | Type                                                                    | Description | Notes                     |
| ------------------------------------ | ----------------------------------------------------------------------- | ----------- | ------------------------- |
| **token**                            | `string`                                                                |             | [Defaults to `undefined`] |
| **createPromoCampaignByUserRequest** | [CreatePromoCampaignByUserRequest](CreatePromoCampaignByUserRequest.md) |             |                           |

### Return type

[**CreatePromoCampaignByUser200Response**](CreatePromoCampaignByUser200Response.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | success                              | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## enterpriseEstimate

> EnterpriseEstimate200Response enterpriseEstimate(xEnterpriseAuth, walletId,
> enterpriseEstimateRequest, acceptLanguage, emulate)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { EnterpriseEstimateOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    xEnterpriseAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string
    walletId: walletId_example,
    // EnterpriseEstimateRequest | bag-of-cells serialized to base64
    enterpriseEstimateRequest: ...,
    // string (optional)
    acceptLanguage: ru-RU,ru;q=0.5,
    // boolean (optional)
    emulate: true,
  } satisfies EnterpriseEstimateOperationRequest;

  try {
    const data = await api.enterpriseEstimate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                          | Type                                                      | Description                       | Notes                                   |
| ----------------------------- | --------------------------------------------------------- | --------------------------------- | --------------------------------------- |
| **xEnterpriseAuth**           | `string`                                                  |                                   | [Defaults to `undefined`]               |
| **walletId**                  | `string`                                                  |                                   | [Defaults to `undefined`]               |
| **enterpriseEstimateRequest** | [EnterpriseEstimateRequest](EnterpriseEstimateRequest.md) | bag-of-cells serialized to base64 |                                         |
| **acceptLanguage**            | `string`                                                  |                                   | [Optional] [Defaults to `&#39;en&#39;`] |
| **emulate**                   | `boolean`                                                 |                                   | [Optional] [Defaults to `false`]        |

### Return type

[**EnterpriseEstimate200Response**](EnterpriseEstimate200Response.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## enterpriseGetMessage

> EnterpriseGetMessage200Response enterpriseGetMessage(xEnterpriseAuth, msgId)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { EnterpriseGetMessageRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    xEnterpriseAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string
    msgId: msgId_example,
  } satisfies EnterpriseGetMessageRequest;

  try {
    const data = await api.enterpriseGetMessage(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type     | Description | Notes                     |
| ------------------- | -------- | ----------- | ------------------------- |
| **xEnterpriseAuth** | `string` |             | [Defaults to `undefined`] |
| **msgId**           | `string` |             | [Defaults to `undefined`] |

### Return type

[**EnterpriseGetMessage200Response**](EnterpriseGetMessage200Response.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | success                              | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## enterpriseGetStatus

> EnterpriseGetStatus200Response enterpriseGetStatus(xEnterpriseAuth)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { EnterpriseGetStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    xEnterpriseAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
  } satisfies EnterpriseGetStatusRequest;

  try {
    const data = await api.enterpriseGetStatus(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type     | Description | Notes                     |
| ------------------- | -------- | ----------- | ------------------------- |
| **xEnterpriseAuth** | `string` |             | [Defaults to `undefined`] |

### Return type

[**EnterpriseGetStatus200Response**](EnterpriseGetStatus200Response.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | success                              | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## enterpriseGetWalletConfig

> EnterpriseWalletConfig enterpriseGetWalletConfig(xEnterpriseAuth, walletId)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { EnterpriseGetWalletConfigRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    xEnterpriseAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string
    walletId: walletId_example,
  } satisfies EnterpriseGetWalletConfigRequest;

  try {
    const data = await api.enterpriseGetWalletConfig(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type     | Description | Notes                     |
| ------------------- | -------- | ----------- | ------------------------- |
| **xEnterpriseAuth** | `string` |             | [Defaults to `undefined`] |
| **walletId**        | `string` |             | [Defaults to `undefined`] |

### Return type

[**EnterpriseWalletConfig**](EnterpriseWalletConfig.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## enterpriseSend

> EnterpriseSend200Response enterpriseSend(xEnterpriseAuth, walletId, enterpriseEstimateRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { EnterpriseSendRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    xEnterpriseAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string
    walletId: walletId_example,
    // EnterpriseEstimateRequest | bag-of-cells serialized to base64
    enterpriseEstimateRequest: ...,
  } satisfies EnterpriseSendRequest;

  try {
    const data = await api.enterpriseSend(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                          | Type                                                      | Description                       | Notes                     |
| ----------------------------- | --------------------------------------------------------- | --------------------------------- | ------------------------- |
| **xEnterpriseAuth**           | `string`                                                  |                                   | [Defaults to `undefined`] |
| **walletId**                  | `string`                                                  |                                   | [Defaults to `undefined`] |
| **enterpriseEstimateRequest** | [EnterpriseEstimateRequest](EnterpriseEstimateRequest.md) | bag-of-cells serialized to base64 |                           |

### Return type

[**EnterpriseSend200Response**](EnterpriseSend200Response.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | success                              | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## estimateGaslessCost

> GaslessEstimation estimateGaslessCost(jettonMaster, estimateGaslessCostRequest, xTonConnectAuth,
> xWalletID, authorization, walletAddress, walletPublicKey, enableValidation)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { EstimateGaslessCostOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    jettonMaster: jettonMaster_example,
    // EstimateGaslessCostRequest
    estimateGaslessCostRequest: ...,
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string (optional)
    walletAddress: walletAddress_example,
    // string (optional)
    walletPublicKey: walletPublicKey_example,
    // boolean (optional)
    enableValidation: true,
  } satisfies EstimateGaslessCostOperationRequest;

  try {
    const data = await api.estimateGaslessCost(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                           | Type                                                        | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| ------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **jettonMaster**               | `string`                                                    |                                                                                                                                                                                                                                                                                                                                                                                                        | [Defaults to `undefined`]            |
| **estimateGaslessCostRequest** | [EstimateGaslessCostRequest](EstimateGaslessCostRequest.md) |                                                                                                                                                                                                                                                                                                                                                                                                        |                                      |
| **xTonConnectAuth**            | `string`                                                    |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**                  | `string`                                                    | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**              | `string`                                                    | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |
| **walletAddress**              | `string`                                                    |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **walletPublicKey**            | `string`                                                    |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **enableValidation**           | `boolean`                                                   |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `false`]     |

### Return type

[**GaslessEstimation**](GaslessEstimation.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## estimateGaslessJettonTransfer

> GaslessCommissionJettonTransfer
> estimateGaslessJettonTransfer(estimateGaslessJettonTransferRequest)

Estimate gasless commission for a jetton transfer by its parameters

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { EstimateGaslessJettonTransferOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // EstimateGaslessJettonTransferRequest
    estimateGaslessJettonTransferRequest: ...,
  } satisfies EstimateGaslessJettonTransferOperationRequest;

  try {
    const data = await api.estimateGaslessJettonTransfer(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                                     | Type                                                                            | Description | Notes |
| ---------------------------------------- | ------------------------------------------------------------------------------- | ----------- | ----- |
| **estimateGaslessJettonTransferRequest** | [EstimateGaslessJettonTransferRequest](EstimateGaslessJettonTransferRequest.md) |             |       |

### Return type

[**GaslessCommissionJettonTransfer**](GaslessCommissionJettonTransfer.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                            | Response headers |
| ----------- | -------------------------------------- | ---------------- |
| **200**     | Gasless commission transfer parameters | -                |
| **0**       | Some error during request processing   | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## extendRefundPeriod

> { [key: string]: any; } extendRefundPeriod(token, purchaseId)

### Example

```ts
import { Configuration, DefaultApi } from '';
import type { ExtendRefundPeriodRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new DefaultApi();

    const body = {
        // string
        token: token_example,
        // number
        purchaseId: 789
    } satisfies ExtendRefundPeriodRequest;

    try {
        const data = await api.extendRefundPeriod(body);
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description | Notes                     |
| -------------- | -------- | ----------- | ------------------------- |
| **token**      | `string` |             | [Defaults to `undefined`] |
| **purchaseId** | `number` |             | [Defaults to `undefined`] |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getBalance

> Balance getBalance(xTonConnectAuth, xWalletID, authorization, units, region)

This method returns information about a user\&#39;s balance.

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { GetBalanceRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // 'usd' | 'ton' (optional)
    units: units_example,
    // string (optional)
    region: region_example,
  } satisfies GetBalanceRequest;

  try {
    const data = await api.getBalance(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type         | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                                     |
| ------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| **xTonConnectAuth** | `string`     |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`]                      |
| **xWalletID**       | `string`     | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`]                      |
| **authorization**   | `string`     | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`]                      |
| **units**           | `usd`, `ton` |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `&#39;usd&#39;`] [Enum: usd, ton] |
| **region**          | `string`     |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`]                      |

### Return type

[**Balance**](Balance.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getBatteryCharged

> BatteryCharged getBatteryCharged(accountId)

This method returns information about a user\&#39;s balance.

### Example

```ts
import { Configuration, DefaultApi } from '';
import type { GetBatteryChargedRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new DefaultApi();

    const body = {
        // string
        accountId: accountId_example
    } satisfies GetBatteryChargedRequest;

    try {
        const data = await api.getBatteryCharged(body);
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name          | Type     | Description | Notes                     |
| ------------- | -------- | ----------- | ------------------------- |
| **accountId** | `string` |             | [Defaults to `undefined`] |

### Return type

[**BatteryCharged**](BatteryCharged.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getConfig

> Config getConfig()

This method returns information about Battery Service.

### Example

```ts
import { Configuration, DefaultApi } from '';
import type { GetConfigRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new DefaultApi();

    try {
        const data = await api.getConfig();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**Config**](Config.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getPromoUsed

> PromoUsed getPromoUsed(promo)

### Example

```ts
import { Configuration, DefaultApi } from '';
import type { GetPromoUsedRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new DefaultApi();

    const body = {
        // string
        promo: promo_example
    } satisfies GetPromoUsedRequest;

    try {
        const data = await api.getPromoUsed(body);
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name      | Type     | Description | Notes                     |
| --------- | -------- | ----------- | ------------------------- |
| **promo** | `string` |             | [Defaults to `undefined`] |

### Return type

[**PromoUsed**](PromoUsed.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getPurchases

> Purchases getPurchases(xTonConnectAuth, xWalletID, authorization, limit, offset,
> includeGiftsOnTheWay)

This method returns a list of purchases made by a specific user.

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { GetPurchasesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // number (optional)
    limit: 56,
    // number (optional)
    offset: 56,
    // boolean (optional)
    includeGiftsOnTheWay: true,
  } satisfies GetPurchasesRequest;

  try {
    const data = await api.getPurchases(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                     | Type      | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **xTonConnectAuth**      | `string`  |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**            | `string`  | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**        | `string`  | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |
| **limit**                | `number`  |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `1000`]      |
| **offset**               | `number`  |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `0`]         |
| **includeGiftsOnTheWay** | `boolean` |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `false`]     |

### Return type

[**Purchases**](Purchases.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getRechargeMethods

> RechargeMethods getRechargeMethods(includeRechargeOnly)

This method returns on-chain recharge methods.

### Example

```ts
import { Configuration, DefaultApi } from '';
import type { GetRechargeMethodsRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new DefaultApi();

    const body = {
        // boolean (optional)
        includeRechargeOnly: true
    } satisfies GetRechargeMethodsRequest;

    try {
        const data = await api.getRechargeMethods(body);
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                    | Type      | Description | Notes                           |
| ----------------------- | --------- | ----------- | ------------------------------- |
| **includeRechargeOnly** | `boolean` |             | [Optional] [Defaults to `true`] |

### Return type

[**RechargeMethods**](RechargeMethods.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getStatus

> Status getStatus(xTonConnectAuth, xWalletID, authorization)

This method returns information about the current status of Battery Service.

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { GetStatusRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
  } satisfies GetStatusRequest;

  try {
    const data = await api.getStatus(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type     | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **xTonConnectAuth** | `string` |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**       | `string` | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**   | `string` | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |

### Return type

[**Status**](Status.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getTransactions

> Transactions getTransactions(xTonConnectAuth, xWalletID, authorization, limit, offset)

This method returns a list of transactions made by a specific user.

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { GetTransactionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // number (optional)
    limit: 56,
    // number (optional)
    offset: 56,
  } satisfies GetTransactionsRequest;

  try {
    const data = await api.getTransactions(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type     | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **xTonConnectAuth** | `string` |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**       | `string` | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**   | `string` | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |
| **limit**           | `number` |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `1000`]      |
| **offset**          | `number` |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `0`]         |

### Return type

[**Transactions**](Transactions.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getTronAvailableTransfers

> TronAvailableTransfers getTronAvailableTransfers(xProAuth)

Get number of available TRON free transfers for Pro users

### Example

```ts
import { Configuration, DefaultApi } from '';
import type { GetTronAvailableTransfersRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new DefaultApi();

    const body = {
        // string | JWT token from Pro service (Bearer token)
        xProAuth: xProAuth_example
    } satisfies GetTronAvailableTransfersRequest;

    try {
        const data = await api.getTronAvailableTransfers(body);
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name         | Type     | Description                               | Notes                     |
| ------------ | -------- | ----------------------------------------- | ------------------------- |
| **xProAuth** | `string` | JWT token from Pro service (Bearer token) | [Defaults to `undefined`] |

### Return type

[**TronAvailableTransfers**](TronAvailableTransfers.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | Available transfers information      | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getTronConfig

> GetTronConfig200Response getTronConfig()

### Example

```ts
import { Configuration, DefaultApi } from '';
import type { GetTronConfigRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new DefaultApi();

    try {
        const data = await api.getTronConfig();
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

This endpoint does not need any parameter.

### Return type

[**GetTronConfig200Response**](GetTronConfig200Response.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getTronTransactions

> TronTransactionsList getTronTransactions(xTonConnectAuth, xWalletID, authorization, limit,
> maxTimestamp)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { GetTronTransactionsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // number (optional)
    limit: 56,
    // number (optional)
    maxTimestamp: 789,
  } satisfies GetTronTransactionsRequest;

  try {
    const data = await api.getTronTransactions(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type     | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **xTonConnectAuth** | `string` |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**       | `string` | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**   | `string` | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |
| **limit**           | `number` |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `1000`]      |
| **maxTimestamp**    | `number` |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |

### Return type

[**TronTransactionsList**](TronTransactionsList.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## increaseUserBalance

> { [key: string]: any; } increaseUserBalance(token, userId, increaseUserBalanceRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { IncreaseUserBalanceOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // number
    userId: 789,
    // IncreaseUserBalanceRequest
    increaseUserBalanceRequest: ...,
  } satisfies IncreaseUserBalanceOperationRequest;

  try {
    const data = await api.increaseUserBalance(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                           | Type                                                        | Description | Notes                     |
| ------------------------------ | ----------------------------------------------------------- | ----------- | ------------------------- |
| **token**                      | `string`                                                    |             | [Defaults to `undefined`] |
| **userId**                     | `number`                                                    |             | [Defaults to `undefined`] |
| **increaseUserBalanceRequest** | [IncreaseUserBalanceRequest](IncreaseUserBalanceRequest.md) |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## iosBatteryPurchase

> IOSBatteryPurchaseStatus iosBatteryPurchase(iosBatteryPurchaseRequest, xTonConnectAuth, xWalletID,
> authorization)

verify an in-app purchase

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { IosBatteryPurchaseOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // IosBatteryPurchaseRequest | In-App purchase
    iosBatteryPurchaseRequest: ...,
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
  } satisfies IosBatteryPurchaseOperationRequest;

  try {
    const data = await api.iosBatteryPurchase(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                          | Type                                                      | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| ----------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **iosBatteryPurchaseRequest** | [IosBatteryPurchaseRequest](IosBatteryPurchaseRequest.md) | In-App purchase                                                                                                                                                                                                                                                                                                                                                                                        |                                      |
| **xTonConnectAuth**           | `string`                                                  |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**                 | `string`                                                  | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**             | `string`                                                  | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |

### Return type

[**IOSBatteryPurchaseStatus**](IOSBatteryPurchaseStatus.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## itrxIoCallback

> { [key: string]: any; } itrxIoCallback(sIGNATURE, tIMESTAMP, requestBody)

receive callback from itrx.io

### Example

```ts
import { Configuration, DefaultApi } from '';
import type { ItrxIoCallbackRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new DefaultApi();

    const body = {
        // string
        sIGNATURE: sIGNATURE_example,
        // string
        tIMESTAMP: tIMESTAMP_example,
        // { [key: string]: any; }
        requestBody: Object
    } satisfies ItrxIoCallbackRequest;

    try {
        const data = await api.itrxIoCallback(body);
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name            | Type                      | Description | Notes                     |
| --------------- | ------------------------- | ----------- | ------------------------- |
| **sIGNATURE**   | `string`                  |             | [Defaults to `undefined`] |
| **tIMESTAMP**   | `string`                  |             | [Defaults to `undefined`] |
| **requestBody** | `{ [key: string]: any; }` |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## migrateOldBattery

> { [key: string]: any; } migrateOldBattery(token, migrateOldBatteryRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { MigrateOldBatteryOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // MigrateOldBatteryRequest
    migrateOldBatteryRequest: ...,
  } satisfies MigrateOldBatteryOperationRequest;

  try {
    const data = await api.migrateOldBattery(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                         | Type                                                    | Description | Notes                     |
| ---------------------------- | ------------------------------------------------------- | ----------- | ------------------------- |
| **token**                    | `string`                                                |             | [Defaults to `undefined`] |
| **migrateOldBatteryRequest** | [MigrateOldBatteryRequest](MigrateOldBatteryRequest.md) |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## migrateRelayer

> { [key: string]: any; } migrateRelayer(token, migrateRelayerRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { MigrateRelayerOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // MigrateRelayerRequest
    migrateRelayerRequest: ...,
  } satisfies MigrateRelayerOperationRequest;

  try {
    const data = await api.migrateRelayer(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                      | Type                                              | Description | Notes                     |
| ------------------------- | ------------------------------------------------- | ----------- | ------------------------- |
| **token**                 | `string`                                          |             | [Defaults to `undefined`] |
| **migrateRelayerRequest** | [MigrateRelayerRequest](MigrateRelayerRequest.md) |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## omnistonSwap

> { [key: string]: any; } omnistonSwap(token, master0, master1, fromAmount)

### Example

```ts
import { Configuration, DefaultApi } from '';
import type { OmnistonSwapRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new DefaultApi();

    const body = {
        // string
        token: token_example,
        // string
        master0: master0_example,
        // string
        master1: master1_example,
        // string
        fromAmount: fromAmount_example
    } satisfies OmnistonSwapRequest;

    try {
        const data = await api.omnistonSwap(body);
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name           | Type     | Description | Notes                     |
| -------------- | -------- | ----------- | ------------------------- |
| **token**      | `string` |             | [Defaults to `undefined`] |
| **master0**    | `string` |             | [Defaults to `undefined`] |
| **master1**    | `string` |             | [Defaults to `undefined`] |
| **fromAmount** | `string` |             | [Defaults to `undefined`] |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## promoCodeBatteryPurchase

> PromoCodeBatteryPurchaseStatus promoCodeBatteryPurchase(promoCodeBatteryPurchaseRequest,
> acceptLanguage, xTonConnectAuth, xWalletID, authorization)

charge battery with promo code

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { PromoCodeBatteryPurchaseOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // PromoCodeBatteryPurchaseRequest | charge battery with promo code
    promoCodeBatteryPurchaseRequest: ...,
    // string (optional)
    acceptLanguage: ru-RU,ru;q=0.5,
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
  } satisfies PromoCodeBatteryPurchaseOperationRequest;

  try {
    const data = await api.promoCodeBatteryPurchase(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                                | Type                                                                  | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                   |
| ----------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| **promoCodeBatteryPurchaseRequest** | [PromoCodeBatteryPurchaseRequest](PromoCodeBatteryPurchaseRequest.md) | charge battery with promo code                                                                                                                                                                                                                                                                                                                                                                         |                                         |
| **acceptLanguage**                  | `string`                                                              |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `&#39;en&#39;`] |
| **xTonConnectAuth**                 | `string`                                                              |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`]    |
| **xWalletID**                       | `string`                                                              | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`]    |
| **authorization**                   | `string`                                                              | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`]    |

### Return type

[**PromoCodeBatteryPurchaseStatus**](PromoCodeBatteryPurchaseStatus.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## relayerToBattery

> { [key: string]: any; } relayerToBattery(token, relayerToBatteryRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { RelayerToBatteryOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // RelayerToBatteryRequest
    relayerToBatteryRequest: ...,
  } satisfies RelayerToBatteryOperationRequest;

  try {
    const data = await api.relayerToBattery(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                        | Type                                                  | Description | Notes                     |
| --------------------------- | ----------------------------------------------------- | ----------- | ------------------------- |
| **token**                   | `string`                                              |             | [Defaults to `undefined`] |
| **relayerToBatteryRequest** | [RelayerToBatteryRequest](RelayerToBatteryRequest.md) |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## replenishOKXBalance

> { [key: string]: any; } replenishOKXBalance(token, replenishOKXBalanceRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { ReplenishOKXBalanceOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // ReplenishOKXBalanceRequest
    replenishOKXBalanceRequest: ...,
  } satisfies ReplenishOKXBalanceOperationRequest;

  try {
    const data = await api.replenishOKXBalance(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                           | Type                                                        | Description | Notes                     |
| ------------------------------ | ----------------------------------------------------------- | ----------- | ------------------------- |
| **token**                      | `string`                                                    |             | [Defaults to `undefined`] |
| **replenishOKXBalanceRequest** | [ReplenishOKXBalanceRequest](ReplenishOKXBalanceRequest.md) |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## requestRefund

> requestRefund(requestRefundRequest, xTonConnectAuth, xWalletID, authorization)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { RequestRefundOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // RequestRefundRequest
    requestRefundRequest: ...,
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
  } satisfies RequestRefundOperationRequest;

  try {
    const data = await api.requestRefund(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                     | Type                                            | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| ------------------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **requestRefundRequest** | [RequestRefundRequest](RequestRefundRequest.md) |                                                                                                                                                                                                                                                                                                                                                                                                        |                                      |
| **xTonConnectAuth**      | `string`                                        |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**            | `string`                                        | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**        | `string`                                        | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | success                              | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## resetUserBalance

> { [key: string]: any; } resetUserBalance(token, userId, resetUserBalanceRequest)

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { ResetUserBalanceOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    token: token_example,
    // number
    userId: 789,
    // ResetUserBalanceRequest
    resetUserBalanceRequest: ...,
  } satisfies ResetUserBalanceOperationRequest;

  try {
    const data = await api.resetUserBalance(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                        | Type                                                  | Description | Notes                     |
| --------------------------- | ----------------------------------------------------- | ----------- | ------------------------- |
| **token**                   | `string`                                              |             | [Defaults to `undefined`] |
| **userId**                  | `number`                                              |             | [Defaults to `undefined`] |
| **resetUserBalanceRequest** | [ResetUserBalanceRequest](ResetUserBalanceRequest.md) |             |                           |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## sendMessage

> sendMessage(sendMessageRequest, xTonConnectAuth, xWalletID, authorization, xPromo)

Send message to blockchain

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { SendMessageOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // SendMessageRequest | bag-of-cells serialized to base64, with a proof of the wallet\'s consent
    sendMessageRequest: ...,
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Promo code the client wants applied. For now it is only accepted, nothing is redeemed by it. (optional)
    xPromo: HAMSTER,
  } satisfies SendMessageOperationRequest;

  try {
    const data = await api.sendMessage(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                   | Type                                        | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| ---------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **sendMessageRequest** | [SendMessageRequest](SendMessageRequest.md) | bag-of-cells serialized to base64, with a proof of the wallet\&#39;s consent                                                                                                                                                                                                                                                                                                                           |                                      |
| **xTonConnectAuth**    | `string`                                    |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**          | `string`                                    | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**      | `string`                                    | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |
| **xPromo**             | `string`                                    | Promo code the client wants applied. For now it is only accepted, nothing is redeemed by it.                                                                                                                                                                                                                                                                                                           | [Optional] [Defaults to `undefined`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers                  |
| ----------- | ------------------------------------ | --------------------------------- |
| **200**     | success                              | \* X-Battery-Protocol-Name - <br> |
| **0**       | Some error during request processing | -                                 |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## tronEstimate

> EstimatedTronTx tronEstimate(wallet, xTonConnectAuth, xWalletID, authorization, xEnterpriseAuth,
> xProAuth, energy, bandwidth, enableValidation)

Estimate cost of sending a tx in Tron network

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { TronEstimateRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // string
    wallet: wallet_example,
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Enterprise access token; use with Tron battery billing for enterprise accounts (optional)
    xEnterpriseAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | JWT token from Pro service for free charges verification (optional)
    xProAuth: xProAuth_example,
    // number (optional)
    energy: 56,
    // number (optional)
    bandwidth: 56,
    // boolean | Enable balance validation for battery charges (optional)
    enableValidation: true,
  } satisfies TronEstimateRequest;

  try {
    const data = await api.tronEstimate(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                 | Type      | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| -------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **wallet**           | `string`  |                                                                                                                                                                                                                                                                                                                                                                                                        | [Defaults to `undefined`]            |
| **xTonConnectAuth**  | `string`  |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**        | `string`  | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**    | `string`  | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |
| **xEnterpriseAuth**  | `string`  | Enterprise access token; use with Tron battery billing for enterprise accounts                                                                                                                                                                                                                                                                                                                         | [Optional] [Defaults to `undefined`] |
| **xProAuth**         | `string`  | JWT token from Pro service for free charges verification                                                                                                                                                                                                                                                                                                                                               | [Optional] [Defaults to `undefined`] |
| **energy**           | `number`  |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **bandwidth**        | `number`  |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **enableValidation** | `boolean` | Enable balance validation for battery charges                                                                                                                                                                                                                                                                                                                                                          | [Optional] [Defaults to `false`]     |

### Return type

[**EstimatedTronTx**](EstimatedTronTx.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## tronSend

> SentTronTx tronSend(tronSendRequest, xTonConnectAuth, xWalletID, authorization, xEnterpriseAuth,
> xProAuth, userPublicKey)

send TRON tx

### Example

```ts
import {
  Configuration,
  DefaultApi,
} from '';
import type { TronSendOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new DefaultApi();

  const body = {
    // TronSendRequest
    tronSendRequest: ...,
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Enterprise access token; use with Tron battery billing for enterprise accounts (optional)
    xEnterpriseAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | JWT token from Pro service for free charges verification (optional)
    xProAuth: xProAuth_example,
    // string | User public key for commission payments (required when instant_fee_tx is provided) (optional)
    userPublicKey: userPublicKey_example,
  } satisfies TronSendOperationRequest;

  try {
    const data = await api.tronSend(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                | Type                                  | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ |
| **tronSendRequest** | [TronSendRequest](TronSendRequest.md) |                                                                                                                                                                                                                                                                                                                                                                                                        |                                      |
| **xTonConnectAuth** | `string`                              |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`] |
| **xWalletID**       | `string`                              | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`] |
| **authorization**   | `string`                              | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`] |
| **xEnterpriseAuth** | `string`                              | Enterprise access token; use with Tron battery billing for enterprise accounts                                                                                                                                                                                                                                                                                                                         | [Optional] [Defaults to `undefined`] |
| **xProAuth**        | `string`                              | JWT token from Pro service for free charges verification                                                                                                                                                                                                                                                                                                                                               | [Optional] [Defaults to `undefined`] |
| **userPublicKey**   | `string`                              | User public key for commission payments (required when instant_fee_tx is provided)                                                                                                                                                                                                                                                                                                                     | [Optional] [Defaults to `undefined`] |

### Return type

[**SentTronTx**](SentTronTx.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | TBD                                  | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## verifyPurchasePromo

> VerifyPurchasePromo200Response verifyPurchasePromo(promo)

### Example

```ts
import { Configuration, DefaultApi } from '';
import type { VerifyPurchasePromoRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new DefaultApi();

    const body = {
        // string (optional)
        promo: promo_example
    } satisfies VerifyPurchasePromoRequest;

    try {
        const data = await api.verifyPurchasePromo(body);
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name      | Type     | Description | Notes                                |
| --------- | -------- | ----------- | ------------------------------------ |
| **promo** | `string` |             | [Optional] [Defaults to `undefined`] |

### Return type

[**VerifyPurchasePromo200Response**](VerifyPurchasePromo200Response.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | all good                             | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
