# ApplyPromoRequest

## Properties

| Name        | Type   |
| ----------- | ------ |
| `publicKey` | string |
| `promoCode` | string |

## Example

```typescript
import type { ApplyPromoRequest } from '';

// TODO: Update the object below with actual values
const example = {
    publicKey: null,
    promoCode: 1234567890
} satisfies ApplyPromoRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ApplyPromoRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
