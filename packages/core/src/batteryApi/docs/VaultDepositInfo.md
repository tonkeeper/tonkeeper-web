# VaultDepositInfo

## Properties

| Name    | Type              |
| ------- | ----------------- |
| `price` | [Price](Price.md) |
| `vault` | string            |

## Example

```typescript
import type { VaultDepositInfo } from ''

// TODO: Update the object below with actual values
const example = {
  "price": null,
  "vault": 0:0BB5A9F69043EEBDDA5AD2E946EB953242BD8F603FE795D90698CEEC6BFC60A0,
} satisfies VaultDepositInfo

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as VaultDepositInfo
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
