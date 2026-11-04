# Price

## Properties

| Name           | Type                            |
| -------------- | ------------------------------- |
| `currencyType` | [CurrencyType](CurrencyType.md) |
| `value`        | string                          |
| `decimals`     | number                          |
| `tokenName`    | string                          |
| `verification` | [TrustType](TrustType.md)       |
| `image`        | string                          |
| `jetton`       | string                          |

## Example

```typescript
import type { Price } from ''

// TODO: Update the object below with actual values
const example = {
  "currencyType": null,
  "value": 123000000000,
  "decimals": 9,
  "tokenName": Gram,
  "verification": null,
  "image": https://cache.tonapi.io/images/jetton.jpg,
  "jetton": 0:0BB5A9F69043EEBDDA5AD2E946EB953242BD8F603FE795D90698CEEC6BFC60A0,
} satisfies Price

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Price
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
