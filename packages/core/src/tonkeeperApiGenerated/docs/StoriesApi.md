# StoriesApi

All URIs are relative to *http://localhost:8888*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**getStories**](StoriesApi.md#getstories) | **GET** /stories/{story_id} |  |
| [**getStoriesBatch**](StoriesApi.md#getstoriesbatch) | **GET** /stories |  |



## getStories

> StoryInfo getStories(storyId, lang, build, platform, storeCountryCode, deviceCountryCode, simCountry, timezone, isVpnActive)



### Example

```ts
import {
  Configuration,
  StoriesApi,
} from '';
import type { GetStoriesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new StoriesApi();

  const body = {
    // string | Story identifier
    storyId: hamster,
    // string | Language code (optional)
    lang: en,
    // string | Build Version (optional)
    build: 3.2.20,
    // Platform | Platform (optional)
    platform: ...,
    // string | Store country code (optional)
    storeCountryCode: UK,
    // string | Device country code (optional)
    deviceCountryCode: UK,
    // string | SIM card country code (optional)
    simCountry: DE,
    // string | Device timezone (IANA format) (optional)
    timezone: Europe/Berlin,
    // boolean | Whether VPN is currently active (optional)
    isVpnActive: true,
  } satisfies GetStoriesRequest;

  try {
    const data = await api.getStories(body);
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
| **storyId** | `string` | Story identifier | [Defaults to `undefined`] |
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |
| **build** | `string` | Build Version | [Optional] [Defaults to `undefined`] |
| **platform** | `Platform` | Platform | [Optional] [Defaults to `undefined`] [Enum: web, android, ios, desktop, tablet, pro_mobile_ios, swap_widget_web, extension, twa] |
| **storeCountryCode** | `string` | Store country code | [Optional] [Defaults to `undefined`] |
| **deviceCountryCode** | `string` | Device country code | [Optional] [Defaults to `undefined`] |
| **simCountry** | `string` | SIM card country code | [Optional] [Defaults to `undefined`] |
| **timezone** | `string` | Device timezone (IANA format) | [Optional] [Defaults to `undefined`] |
| **isVpnActive** | `boolean` | Whether VPN is currently active | [Optional] [Defaults to `undefined`] |

### Return type

[**StoryInfo**](StoryInfo.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Story pages |  -  |
| **400** | Bad request |  -  |
| **404** | The specified resource was not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getStoriesBatch

> GetStoriesBatch200Response getStoriesBatch(ids, lang, build, platform, storeCountryCode, deviceCountryCode, simCountry, timezone, isVpnActive)



### Example

```ts
import {
  Configuration,
  StoriesApi,
} from '';
import type { GetStoriesBatchRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new StoriesApi();

  const body = {
    // string | Story identifiers
    ids: hamster,usdt-trc20,
    // string | Language code (optional)
    lang: en,
    // string | Build Version (optional)
    build: 3.2.20,
    // Platform | Platform (optional)
    platform: ...,
    // string | Store country code (optional)
    storeCountryCode: UK,
    // string | Device country code (optional)
    deviceCountryCode: UK,
    // string | SIM card country code (optional)
    simCountry: DE,
    // string | Device timezone (IANA format) (optional)
    timezone: Europe/Berlin,
    // boolean | Whether VPN is currently active (optional)
    isVpnActive: true,
  } satisfies GetStoriesBatchRequest;

  try {
    const data = await api.getStoriesBatch(body);
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
| **ids** | `string` | Story identifiers | [Defaults to `undefined`] |
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |
| **build** | `string` | Build Version | [Optional] [Defaults to `undefined`] |
| **platform** | `Platform` | Platform | [Optional] [Defaults to `undefined`] [Enum: web, android, ios, desktop, tablet, pro_mobile_ios, swap_widget_web, extension, twa] |
| **storeCountryCode** | `string` | Store country code | [Optional] [Defaults to `undefined`] |
| **deviceCountryCode** | `string` | Device country code | [Optional] [Defaults to `undefined`] |
| **simCountry** | `string` | SIM card country code | [Optional] [Defaults to `undefined`] |
| **timezone** | `string` | Device timezone (IANA format) | [Optional] [Defaults to `undefined`] |
| **isVpnActive** | `boolean` | Whether VPN is currently active | [Optional] [Defaults to `undefined`] |

### Return type

[**GetStoriesBatch200Response**](GetStoriesBatch200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Stories with their pages |  -  |
| **400** | Bad request |  -  |
| **404** | The specified resource was not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

