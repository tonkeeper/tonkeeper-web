# SystemApi

All URIs are relative to *http://localhost:8888*

| Method | HTTP request | Description |
|------------- | ------------- | -------------|
| [**checkForUpdatesGet**](SystemApi.md#checkforupdatesget) | **GET** /check-for-updates |  |
| [**getAllKeys**](SystemApi.md#getallkeys) | **GET** /keys/all |  |
| [**getCurrencies**](SystemApi.md#getcurrencies) | **GET** /currencies |  |
| [**getFiatMethods**](SystemApi.md#getfiatmethods) | **GET** /fiat/methods |  |
| [**getKeys**](SystemApi.md#getkeys) | **GET** /keys |  |
| [**getNotifications**](SystemApi.md#getnotifications) | **GET** /notifications |  |
| [**getPopularApps**](SystemApi.md#getpopularapps) | **GET** /apps/popular |  |
| [**getV2Keys**](SystemApi.md#getv2keys) | **GET** /v2/keys |  |
| [**myIp**](SystemApi.md#myip) | **GET** /my/ip |  |
| [**pingReadyGet**](SystemApi.md#pingreadyget) | **GET** /ready |  |
| [**pingReadyHead**](SystemApi.md#pingreadyhead) | **HEAD** /ready |  |
| [**signMoonpay**](SystemApi.md#signmoonpay) | **GET** /sign/moonpay |  |



## checkForUpdatesGet

> CheckForUpdatesGet200Response checkForUpdatesGet()



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { CheckForUpdatesGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  try {
    const data = await api.checkForUpdatesGet();
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

[**CheckForUpdatesGet200Response**](CheckForUpdatesGet200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Latest version information |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getAllKeys

> GetAllKeys200Response getAllKeys(lang, build, platform, storeCountryCode, deviceCountryCode, simCountry, timezone, isVpnActive)



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { GetAllKeysRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  const body = {
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
  } satisfies GetAllKeysRequest;

  try {
    const data = await api.getAllKeys(body);
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
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |
| **build** | `string` | Build Version | [Optional] [Defaults to `undefined`] |
| **platform** | `Platform` | Platform | [Optional] [Defaults to `undefined`] [Enum: web, android, ios, desktop, tablet, pro_mobile_ios, swap_widget_web, extension, twa] |
| **storeCountryCode** | `string` | Store country code | [Optional] [Defaults to `undefined`] |
| **deviceCountryCode** | `string` | Device country code | [Optional] [Defaults to `undefined`] |
| **simCountry** | `string` | SIM card country code | [Optional] [Defaults to `undefined`] |
| **timezone** | `string` | Device timezone (IANA format) | [Optional] [Defaults to `undefined`] |
| **isVpnActive** | `boolean` | Whether VPN is currently active | [Optional] [Defaults to `undefined`] |

### Return type

[**GetAllKeys200Response**](GetAllKeys200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | All keys configuration |  -  |
| **400** | Bad request |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getCurrencies

> GetCurrencies200Response getCurrencies(platform, build, lang, storeCountryCode, deviceCountryCode, simCountry, timezone, isVpnActive)



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { GetCurrenciesRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  const body = {
    // Platform | Platform (optional)
    platform: ...,
    // string | Build Version (optional)
    build: 3.2.20,
    // string | Language code (optional)
    lang: en,
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
  } satisfies GetCurrenciesRequest;

  try {
    const data = await api.getCurrencies(body);
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
| **platform** | `Platform` | Platform | [Optional] [Defaults to `undefined`] [Enum: web, android, ios, desktop, tablet, pro_mobile_ios, swap_widget_web, extension, twa] |
| **build** | `string` | Build Version | [Optional] [Defaults to `undefined`] |
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |
| **storeCountryCode** | `string` | Store country code | [Optional] [Defaults to `undefined`] |
| **deviceCountryCode** | `string` | Device country code | [Optional] [Defaults to `undefined`] |
| **simCountry** | `string` | SIM card country code | [Optional] [Defaults to `undefined`] |
| **timezone** | `string` | Device timezone (IANA format) | [Optional] [Defaults to `undefined`] |
| **isVpnActive** | `boolean` | Whether VPN is currently active | [Optional] [Defaults to `undefined`] |

### Return type

[**GetCurrencies200Response**](GetCurrencies200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Currencies |  -  |
| **400** | Bad request |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getFiatMethods

> GetFiatMethods200Response getFiatMethods(chainName, lang, countryCode, build, platform, storeCountryCode, deviceCountryCode, simCountry, timezone, isVpnActive)



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { GetFiatMethodsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  const body = {
    // ChainName | Chain Name (optional)
    chainName: ...,
    // string | Language code (optional)
    lang: en,
    // string | Country Code (optional)
    countryCode: RU,
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
  } satisfies GetFiatMethodsRequest;

  try {
    const data = await api.getFiatMethods(body);
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
| **chainName** | `ChainName` | Chain Name | [Optional] [Defaults to `undefined`] [Enum: mainnet, testnet, tetra] |
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |
| **countryCode** | `string` | Country Code | [Optional] [Defaults to `undefined`] |
| **build** | `string` | Build Version | [Optional] [Defaults to `undefined`] |
| **platform** | `Platform` | Platform | [Optional] [Defaults to `undefined`] [Enum: web, android, ios, desktop, tablet, pro_mobile_ios, swap_widget_web, extension, twa] |
| **storeCountryCode** | `string` | Store country code | [Optional] [Defaults to `undefined`] |
| **deviceCountryCode** | `string` | Device country code | [Optional] [Defaults to `undefined`] |
| **simCountry** | `string` | SIM card country code | [Optional] [Defaults to `undefined`] |
| **timezone** | `string` | Device timezone (IANA format) | [Optional] [Defaults to `undefined`] |
| **isVpnActive** | `boolean` | Whether VPN is currently active | [Optional] [Defaults to `undefined`] |

### Return type

[**GetFiatMethods200Response**](GetFiatMethods200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Available fiat payment methods |  -  |
| **400** | Bad request |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getKeys

> { [key: string]: any; } getKeys(chainName, lang, build, platform, storeCountryCode, deviceCountryCode, simCountry, timezone, isVpnActive)



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { GetKeysRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  const body = {
    // ChainName | Chain Name (optional)
    chainName: ...,
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
  } satisfies GetKeysRequest;

  try {
    const data = await api.getKeys(body);
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
| **chainName** | `ChainName` | Chain Name | [Optional] [Defaults to `undefined`] [Enum: mainnet, testnet, tetra] |
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |
| **build** | `string` | Build Version | [Optional] [Defaults to `undefined`] |
| **platform** | `Platform` | Platform | [Optional] [Defaults to `undefined`] [Enum: web, android, ios, desktop, tablet, pro_mobile_ios, swap_widget_web, extension, twa] |
| **storeCountryCode** | `string` | Store country code | [Optional] [Defaults to `undefined`] |
| **deviceCountryCode** | `string` | Device country code | [Optional] [Defaults to `undefined`] |
| **simCountry** | `string` | SIM card country code | [Optional] [Defaults to `undefined`] |
| **timezone** | `string` | Device timezone (IANA format) | [Optional] [Defaults to `undefined`] |
| **isVpnActive** | `boolean` | Whether VPN is currently active | [Optional] [Defaults to `undefined`] |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Keys configuration |  -  |
| **400** | Bad request |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getNotifications

> GetNotifications200Response getNotifications(platform, build, lang)



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { GetNotificationsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  const body = {
    // Platform | Platform (optional)
    platform: ...,
    // string | Build Version (optional)
    build: 3.2.20,
    // string | Language code (optional)
    lang: en,
  } satisfies GetNotificationsRequest;

  try {
    const data = await api.getNotifications(body);
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
| **platform** | `Platform` | Platform | [Optional] [Defaults to `undefined`] [Enum: web, android, ios, desktop, tablet, pro_mobile_ios, swap_widget_web, extension, twa] |
| **build** | `string` | Build Version | [Optional] [Defaults to `undefined`] |
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |

### Return type

[**GetNotifications200Response**](GetNotifications200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | System notifications |  -  |
| **400** | Bad request |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getPopularApps

> GetPopularApps200Response getPopularApps(lang, build, platform, withAds, storeCountryCode, deviceCountryCode, simCountry, timezone, isVpnActive)



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { GetPopularAppsRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  const body = {
    // string | Language code (optional)
    lang: en,
    // string | Build Version (optional)
    build: 3.2.20,
    // Platform | Platform (optional)
    platform: ...,
    // boolean | Include ads in response (optional)
    withAds: true,
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
  } satisfies GetPopularAppsRequest;

  try {
    const data = await api.getPopularApps(body);
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
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |
| **build** | `string` | Build Version | [Optional] [Defaults to `undefined`] |
| **platform** | `Platform` | Platform | [Optional] [Defaults to `undefined`] [Enum: web, android, ios, desktop, tablet, pro_mobile_ios, swap_widget_web, extension, twa] |
| **withAds** | `boolean` | Include ads in response | [Optional] [Defaults to `false`] |
| **storeCountryCode** | `string` | Store country code | [Optional] [Defaults to `undefined`] |
| **deviceCountryCode** | `string` | Device country code | [Optional] [Defaults to `undefined`] |
| **simCountry** | `string` | SIM card country code | [Optional] [Defaults to `undefined`] |
| **timezone** | `string` | Device timezone (IANA format) | [Optional] [Defaults to `undefined`] |
| **isVpnActive** | `boolean` | Whether VPN is currently active | [Optional] [Defaults to `undefined`] |

### Return type

[**GetPopularApps200Response**](GetPopularApps200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Popular applications |  -  |
| **400** | Bad request |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## getV2Keys

> { [key: string]: any; } getV2Keys(lang, build, platform, storeCountryCode, deviceCountryCode, simCountry, timezone, isVpnActive)



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { GetV2KeysRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  const body = {
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
  } satisfies GetV2KeysRequest;

  try {
    const data = await api.getV2Keys(body);
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
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |
| **build** | `string` | Build Version | [Optional] [Defaults to `undefined`] |
| **platform** | `Platform` | Platform | [Optional] [Defaults to `undefined`] [Enum: web, android, ios, desktop, tablet, pro_mobile_ios, swap_widget_web, extension, twa] |
| **storeCountryCode** | `string` | Store country code | [Optional] [Defaults to `undefined`] |
| **deviceCountryCode** | `string` | Device country code | [Optional] [Defaults to `undefined`] |
| **simCountry** | `string` | SIM card country code | [Optional] [Defaults to `undefined`] |
| **timezone** | `string` | Device timezone (IANA format) | [Optional] [Defaults to `undefined`] |
| **isVpnActive** | `boolean` | Whether VPN is currently active | [Optional] [Defaults to `undefined`] |

### Return type

**{ [key: string]: any; }**

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Keys configuration |  -  |
| **400** | Bad request |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## myIp

> MyIp200Response myIp()



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { MyIpRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  try {
    const data = await api.myIp();
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

[**MyIp200Response**](MyIp200Response.md)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Client IP information |  -  |
| **400** | Bad request |  -  |
| **404** | The specified resource was not found |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## pingReadyGet

> pingReadyGet()



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { PingReadyGetRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  try {
    const data = await api.pingReadyGet();
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

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Ok |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## pingReadyHead

> pingReadyHead()



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { PingReadyHeadRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  try {
    const data = await api.pingReadyHead();
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

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **200** | Ok |  -  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


## signMoonpay

> signMoonpay(baseCurrencyCode, currencyCode, walletAddress, lang)



### Example

```ts
import {
  Configuration,
  SystemApi,
} from '';
import type { SignMoonpayRequest } from '';

async function example() {
  console.log("🚀 Testing  SDK...");
  const api = new SystemApi();

  const body = {
    // string | Base currency code
    baseCurrencyCode: USD,
    // string | Target currency code
    currencyCode: TON,
    // string | Wallet address
    walletAddress: walletAddress_example,
    // string | Language code (optional)
    lang: en,
  } satisfies SignMoonpayRequest;

  try {
    const data = await api.signMoonpay(body);
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
| **baseCurrencyCode** | `string` | Base currency code | [Defaults to `undefined`] |
| **currencyCode** | `string` | Target currency code | [Defaults to `undefined`] |
| **walletAddress** | `string` | Wallet address | [Defaults to `undefined`] |
| **lang** | `string` | Language code | [Optional] [Defaults to `&#39;en&#39;`] |

### Return type

`void` (Empty response body)

### Authorization

No authorization required

### HTTP request headers

- **Content-Type**: Not defined
- **Accept**: `application/json`


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
| **302** | Redirect to Moonpay |  * Location -  <br>  |
| **500** | Internal server error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)

