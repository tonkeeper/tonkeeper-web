# EnterpriseEstimateRequest

## Properties

| Name              | Type   |
| ----------------- | ------ |
| `boc`             | string |
| `walletPublicKey` | string |

## Example

```typescript
import type { EnterpriseEstimateRequest } from '';

// TODO: Update the object below with actual values
const example = {
    boc: te6ccgECBQEAARUAAkWIAWTtae + KgtbrX26Bep8JSq8lFLfGOoyGR / xwdjfvpvEaHg,
    walletPublicKey: null
} satisfies EnterpriseEstimateRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EnterpriseEstimateRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
