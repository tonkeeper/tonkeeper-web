# WidgetApi

All URIs are relative to *http://localhost:8888*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getBuyRatesWidget**](WidgetApi.md#getbuyrateswidget) | **GET** /widget/buy/rates |  |
| [**getSellRatesWidget**](WidgetApi.md#getsellrateswidget) | **GET** /widget/sell/rates |  |



## getBuyRatesWidget

> GetSellRatesWidget200Response getBuyRatesWidget(currency)



### Example

```ts
import {
  Configuration,
  WidgetApi,
} from '';
import type { GetBuyRatesWidgetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new WidgetApi();

  const body = {
    // string | Currency code
    currency: USD,
  } satisfies GetBuyRatesWidgetRequest;

  try {
    const data = await api.getBuyRatesWidget(body);
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
| **currency** | `string` | Currency code | [Defaults to `undefined`] |

### Return type

[**GetSellRatesWidget200Response**](GetSellRatesWidget200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Widget exchange rates |  -  |
| **400** | Bad request |  -  |
| **404** | The specified resource was not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getSellRatesWidget

> GetSellRatesWidget200Response getSellRatesWidget(currency)



### Example

```ts
import {
  Configuration,
  WidgetApi,
} from '';
import type { GetSellRatesWidgetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new WidgetApi();

  const body = {
    // string | Currency code
    currency: USD,
  } satisfies GetSellRatesWidgetRequest;

  try {
    const data = await api.getSellRatesWidget(body);
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
| **currency** | `string` | Currency code | [Defaults to `undefined`] |

### Return type

[**GetSellRatesWidget200Response**](GetSellRatesWidget200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Widget exchange rates |  -  |
| **400** | Bad request |  -  |
| **404** | The specified resource was not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

