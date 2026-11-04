# IOSBatteryPurchaseStatusTransactionsInner

## Properties

| Name            | Type                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------- |
| `transactionId` | string                                                                                              |
| `success`       | boolean                                                                                             |
| `error`         | [IOSBatteryPurchaseStatusTransactionsInnerError](IOSBatteryPurchaseStatusTransactionsInnerError.md) |

## Example

```typescript
import type { IOSBatteryPurchaseStatusTransactionsInner } from '';

// TODO: Update the object below with actual values
const example = {
    transactionId: 1000000790000000,
    success: true,
    error: null
} satisfies IOSBatteryPurchaseStatusTransactionsInner;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as IOSBatteryPurchaseStatusTransactionsInner;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
