# PromoCodeBatteryPurchaseStatusError

## Properties

| Name   | Type   |
| ------ | ------ |
| `msg`  | string |
| `code` | string |

## Example

```typescript
import type { PromoCodeBatteryPurchaseStatusError } from ''

// TODO: Update the object below with actual values
const example = {
  "msg": Temporary error. Try again later.,
  "code": promo-code-not-found,
} satisfies PromoCodeBatteryPurchaseStatusError

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PromoCodeBatteryPurchaseStatusError
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
