# TronSendRequest

## Properties

| Name           | Type   |
| -------------- | ------ |
| `tx`           | string |
| `energy`       | number |
| `bandwidth`    | number |
| `wallet`       | string |
| `instantFeeTx` | string |

## Example

```typescript
import type { TronSendRequest } from '';

// TODO: Update the object below with actual values
const example = {
    tx: null,
    energy: null,
    bandwidth: null,
    wallet: null,
    instantFeeTx: null
} satisfies TronSendRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TronSendRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
