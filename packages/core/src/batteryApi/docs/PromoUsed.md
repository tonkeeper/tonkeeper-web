# PromoUsed

## Properties

| Name           | Type                                                               |
| -------------- | ------------------------------------------------------------------ |
| `promoUsed`    | boolean                                                            |
| `bonusCharges` | string                                                             |
| `purchases`    | [Array&lt;PromoUsedPurchasesInner&gt;](PromoUsedPurchasesInner.md) |

## Example

```typescript
import type { PromoUsed } from '';

// TODO: Update the object below with actual values
const example = {
    promoUsed: null,
    bonusCharges: 10.25,
    purchases: null
} satisfies PromoUsed;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PromoUsed;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
