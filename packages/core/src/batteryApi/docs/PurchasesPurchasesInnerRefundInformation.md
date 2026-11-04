# PurchasesPurchasesInnerRefundInformation

## Properties

| Name                | Type                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `fullyRefunded`     | boolean                                                                                                 |
| `partiallyRefunded` | boolean                                                                                                 |
| `pendingRefund`     | boolean                                                                                                 |
| `refunded`          | [PurchasesPurchasesInnerRefundInformationRefunded](PurchasesPurchasesInnerRefundInformationRefunded.md) |
| `refundable`        | [PurchasesPurchasesInnerRefundInformationRefunded](PurchasesPurchasesInnerRefundInformationRefunded.md) |

## Example

```typescript
import type { PurchasesPurchasesInnerRefundInformation } from '';

// TODO: Update the object below with actual values
const example = {
    fullyRefunded: null,
    partiallyRefunded: null,
    pendingRefund: null,
    refunded: null,
    refundable: null
} satisfies PurchasesPurchasesInnerRefundInformation;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PurchasesPurchasesInnerRefundInformation;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
