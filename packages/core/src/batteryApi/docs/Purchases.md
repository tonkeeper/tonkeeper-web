# Purchases

## Properties

| Name             | Type                                                               |
| ---------------- | ------------------------------------------------------------------ |
| `totalPurchases` | number                                                             |
| `purchases`      | [Array&lt;PurchasesPurchasesInner&gt;](PurchasesPurchasesInner.md) |

## Example

```typescript
import type { Purchases } from '';

// TODO: Update the object below with actual values
const example = {
    totalPurchases: 1,
    purchases: null
} satisfies Purchases;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Purchases;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
