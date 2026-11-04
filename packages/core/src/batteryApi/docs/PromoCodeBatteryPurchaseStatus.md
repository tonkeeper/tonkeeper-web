# PromoCodeBatteryPurchaseStatus

## Properties

| Name            | Type                                                                          |
| --------------- | ----------------------------------------------------------------------------- |
| `balanceChange` | string                                                                        |
| `success`       | boolean                                                                       |
| `error`         | [PromoCodeBatteryPurchaseStatusError](PromoCodeBatteryPurchaseStatusError.md) |

## Example

```typescript
import type { PromoCodeBatteryPurchaseStatus } from '';

// TODO: Update the object below with actual values
const example = {
    balanceChange: 10.25,
    success: true,
    error: null
} satisfies PromoCodeBatteryPurchaseStatus;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PromoCodeBatteryPurchaseStatus;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
