# EnterpriseGetMessage200Response

## Properties

| Name              | Type   |
| ----------------- | ------ |
| `paymentTxHash`   | string |
| `committedTxHash` | string |
| `status`          | string |
| `finalCost`       | string |
| `failedReason`    | string |

## Example

```typescript
import type { EnterpriseGetMessage200Response } from '';

// TODO: Update the object below with actual values
const example = {
    paymentTxHash: null,
    committedTxHash: null,
    status: null,
    finalCost: null,
    failedReason: null
} satisfies EnterpriseGetMessage200Response;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EnterpriseGetMessage200Response;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
