# EthenaApi

All URIs are relative to *http://localhost:8888*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getStakingEthenaMethods**](EthenaApi.md#getstakingethenamethods) | **GET** /staking/ethena |  |



## getStakingEthenaMethods

> GetStakingEthenaMethods200Response getStakingEthenaMethods(address, lang)



### Example

```ts
import {
  Configuration,
  EthenaApi,
} from '';
import type { GetStakingEthenaMethodsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new EthenaApi();

  const body = {
    // string | Address
    address: address_example,
    // string | Language code (optional)
    lang: en,
  } satisfies GetStakingEthenaMethodsRequest;

  try {
    const data = await api.getStakingEthenaMethods(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```

### Parameters


| Name | Type | Description  | Notes |
|------------- | ------------- | ------------- | -------------|
| **address** | `string` | Address | [Defaults to `undefined`] |
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |

### Return type

[**GetStakingEthenaMethods200Response**](GetStakingEthenaMethods200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Ethena staking methods |  -  |
| **400** | Bad request |  -  |
| **404** | The specified resource was not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

