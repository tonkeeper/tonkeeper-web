# AndroidBatteryPurchaseStatusPurchasesInner

## Properties

| Name        | Type                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| `productId` | string                                                                                                |
| `token`     | string                                                                                                |
| `success`   | boolean                                                                                               |
| `error`     | [AndroidBatteryPurchaseStatusPurchasesInnerError](AndroidBatteryPurchaseStatusPurchasesInnerError.md) |

## Example

```typescript
import type { AndroidBatteryPurchaseStatusPurchasesInner } from '';

// TODO: Update the object below with actual values
const example = {
    productId: 1000000790000000,
    token: 1000000790000000,
    success: true,
    error: null
} satisfies AndroidBatteryPurchaseStatusPurchasesInner;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AndroidBatteryPurchaseStatusPurchasesInner;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
