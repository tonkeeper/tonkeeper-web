# ConnectApi

All URIs are relative to *https://battery.tonkeeper.com*

| Method                                                         | HTTP request                | Description |
| -------------------------------------------------------------- | --------------------------- | ----------- |
| [**getTonConnectPayload**](ConnectApi.md#gettonconnectpayload) | **GET** /tonconnect/payload |             |

## getTonConnectPayload

> GetTonConnectPayload200Response getTonConnectPayload()

Get a payload for further token receipt

### Example

```ts
import { Configuration, ConnectApi } from '';
import type { GetTonConnectPayloadRequest } from '';

async function example() {
    console.log('🚀 Testing  SDK...');
    const api = new ConnectApi();

    try {
        const data = await api.getTonConnectPayload();
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

[**GetTonConnectPayload200Response**](GetTonConnectPayload200Response.md)

### Authorization

No authorization required

### HTTP request headers

-   **Content-Type**: Not defined
-   **Accept**: `application/json`

### HTTP response details

| Status code | Description                          | Response headers |
| ----------- | ------------------------------------ | ---------------- |
| **200**     | payload                              | -                |
| **0**       | Some error during request processing | -                |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
