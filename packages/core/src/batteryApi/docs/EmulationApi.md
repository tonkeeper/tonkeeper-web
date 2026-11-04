# EmulationApi

All URIs are relative to *https://battery.tonkeeper.com*

| Method                                                                        | HTTP request                         | Description |
| ----------------------------------------------------------------------------- | ------------------------------------ | ----------- |
| [**emulateMessageToWallet**](EmulationApi.md#emulatemessagetowalletoperation) | **POST** /wallet/emulate             |             |
| [**getJettonMetadata**](EmulationApi.md#getjettonmetadata)                    | **GET** /jetton-metadata/{name}.json |             |

## emulateMessageToWallet

> MessageConsequences emulateMessageToWallet(emulateMessageToWalletRequest, acceptLanguage,
> xTonConnectAuth, xWalletID, authorization, enableValidation)

Emulate sending message to blockchain

### Example

```ts
import {
  Configuration,
  EmulationApi,
} from '';
import type { EmulateMessageToWalletOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new EmulationApi();

  const body = {
    // EmulateMessageToWalletRequest | bag-of-cells serialized to base64
    emulateMessageToWalletRequest: ...,
    // string (optional)
    acceptLanguage: ru-RU,ru;q=0.5,
    // string (optional)
    xTonConnectAuth: NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // string | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. (optional)
    xWalletID: abcdefghijklmnopqrstuvwxyz234567,
    // string | Bearer token for WalletID-based requests, \"Bearer <token>\". The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth. (optional)
    authorization: Bearer NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODQ3...,
    // boolean (optional)
    enableValidation: true,
  } satisfies EmulateMessageToWalletOperationRequest;

  try {
    const data = await api.emulateMessageToWallet(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                              | Type                                                              | Description                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                   |
| --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| **emulateMessageToWalletRequest** | [EmulateMessageToWalletRequest](EmulateMessageToWalletRequest.md) | bag-of-cells serialized to base64                                                                                                                                                                                                                                                                                                                                                                      |                                         |
| **acceptLanguage**                | `string`                                                          |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `&#39;en&#39;`] |
| **xTonConnectAuth**               | `string`                                                          |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `undefined`]    |
| **xWalletID**                     | `string`                                                          | Tonkeeper WalletID identifying the wallet. Two formats are accepted: hex64 (legacy v1) or base32 lowercase 32-char (v2). When it comes with a valid X-Wallet-Token, the request is authenticated by the wallet id; otherwise X-TonConnect-Auth is used as before. The wallet id alone identifies the user; the public key is not sent by the client, it is taken from the message the request carries. | [Optional] [Defaults to `undefined`]    |
| **authorization**                 | `string`                                                          | Bearer token for WalletID-based requests, \&quot;Bearer &lt;token&gt;\&quot;. The token is compared against the server-configured one (WALLET_ID_TEST_TOKEN). A request that has X-Wallet-ID with a wrong token is rejected with 401 unless it also carries X-TonConnect-Auth.                                                                                                                         | [Optional] [Defaults to `undefined`]    |
| **enableValidation**              | `boolean`                                                         |                                                                                                                                                                                                                                                                                                                                                                                                        | [Optional] [Defaults to `false`]        |

### Return type

[**MessageConsequences**](MessageConsequences.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers                                                                                                                   |
| ----------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **200**     | emulated message                     | _ Allowed-By-Battery - <br> _ Supported-By-Battery - <br> _ Reject-Reason - <br> _ X-Battery-Protocol-Name - <br> \* Excess - <br> |
| **0**       | Some error during request processing | -                                                                                                                                  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

## getJettonMetadata

> { [key: string]: any; } getJettonMetadata(name)

### Example

```ts
import { Configuration, EmulationApi } from '';
import type { GetJettonMetadataRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new EmulationApi();

    const body = {
        // string
        name: name_example
    } satisfies GetJettonMetadataRequest;

    try {
        const data = await api.getJettonMetadata(body);
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name     | Type     | Description | Notes                     |
| -------- | -------- | ----------- | ------------------------- |
| **name** | `string` |             | [Defaults to `undefined`] |

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
| **200**     |                                      | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
