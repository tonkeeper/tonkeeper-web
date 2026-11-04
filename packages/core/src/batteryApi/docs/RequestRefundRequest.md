# RequestRefundRequest

## Properties

| Name             | Type   |
| ---------------- | ------ |
| `userPurchaseId` | number |
| `purchaseId`     | number |

## Example

```typescript
import type { RequestRefundRequest } from '';

// TODO: Update the object below with actual values
const example = {
    userPurchaseId: 43,
    purchaseId: 43
} satisfies RequestRefundRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RequestRefundRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
