# EstimatedTronTx

## Properties

| Name                | Type                                                      |
| ------------------- | --------------------------------------------------------- |
| `energyCharges`     | number                                                    |
| `bandwidthCharges`  | number                                                    |
| `activationCharges` | number                                                    |
| `totalCharges`      | number                                                    |
| `instantFee`        | [EstimatedTronTxInstantFee](EstimatedTronTxInstantFee.md) |

## Example

```typescript
import type { EstimatedTronTx } from '';

// TODO: Update the object below with actual values
const example = {
    energyCharges: null,
    bandwidthCharges: null,
    activationCharges: null,
    totalCharges: null,
    instantFee: null
} satisfies EstimatedTronTx;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EstimatedTronTx;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
