# PurchasesPurchasesInner

## Properties

| Name                | Type                                                                                    |
| ------------------- | --------------------------------------------------------------------------------------- |
| `promo`             | string                                                                                  |
| `forAccountId`      | string                                                                                  |
| `userPurchaseId`    | number                                                                                  |
| `purchaseId`        | number                                                                                  |
| `type`              | string                                                                                  |
| `amount`            | string                                                                                  |
| `charges`           | number                                                                                  |
| `currency`          | string                                                                                  |
| `datetime`          | string                                                                                  |
| `refundInformation` | [PurchasesPurchasesInnerRefundInformation](PurchasesPurchasesInnerRefundInformation.md) |

## Example

```typescript
import type { PurchasesPurchasesInner } from ''

// TODO: Update the object below with actual values
const example = {
  "promo": null,
  "forAccountId": null,
  "userPurchaseId": 2,
  "purchaseId": 2,
  "type": android,
  "amount": 10.250,
  "charges": 1200,
  "currency": USDT,
  "datetime": 2006-01-02T15:04:05Z07:00,
  "refundInformation": null,
} satisfies PurchasesPurchasesInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PurchasesPurchasesInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
