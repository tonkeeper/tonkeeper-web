# WalletApi

All URIs are relative to *https://battery.tonkeeper.com*

| Method                                                       | HTTP request               | Description |
| ------------------------------------------------------------ | -------------------------- | ----------- |
| [**tonConnectProof**](WalletApi.md#tonconnectproofoperation) | **POST** /tonconnect/proof |             |

## tonConnectProof

> TonConnectProof200Response tonConnectProof(tonConnectProofRequest)

Account verification and token issuance

### Example

```ts
import {
  Configuration,
  WalletApi,
} from '';
import type { TonConnectProofOperationRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new WalletApi();

  const body = {
    // TonConnectProofRequest | Data that is expected from TON Connect
    tonConnectProofRequest: ...,
  } satisfies TonConnectProofOperationRequest;

  try {
    const data = await api.tonConnectProof(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters

| Name                       | Type                                                | Description                            | Notes |
| -------------------------- | --------------------------------------------------- | -------------------------------------- | ----- |
| **tonConnectProofRequest** | [TonConnectProofRequest](TonConnectProofRequest.md) | Data that is expected from TON Connect |       |

### Return type

[**TonConnectProof200Response**](TonConnectProof200Response.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: `application/json`
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | auth token                           | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
