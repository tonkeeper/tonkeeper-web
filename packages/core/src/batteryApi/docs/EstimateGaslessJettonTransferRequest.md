# EstimateGaslessJettonTransferRequest

## Properties

| Name                  | Type   |
| --------------------- | ------ |
| `jettonMaster`        | string |
| `destination`         | string |
| `responseDestination` | string |
| `attachedTon`         | string |
| `forwardTonAmount`    | string |

## Example

```typescript
import type { EstimateGaslessJettonTransferRequest } from '';

// TODO: Update the object below with actual values
const example = {
    jettonMaster: null,
    destination: null,
    responseDestination: null,
    attachedTon: null,
    forwardTonAmount: null
} satisfies EstimateGaslessJettonTransferRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EstimateGaslessJettonTransferRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
