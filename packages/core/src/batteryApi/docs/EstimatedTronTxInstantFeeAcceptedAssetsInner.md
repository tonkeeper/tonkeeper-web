# EstimatedTronTxInstantFeeAcceptedAssetsInner

## Properties

| Name             | Type   |
| ---------------- | ------ |
| `type`           | string |
| `name`           | string |
| `jettonMasterId` | string |
| `amountNano`     | string |
| `decimals`       | number |

## Example

```typescript
import type { EstimatedTronTxInstantFeeAcceptedAssetsInner } from '';

// TODO: Update the object below with actual values
const example = {
    type: null,
    name: null,
    jettonMasterId: null,
    amountNano: 10.25,
    decimals: null
} satisfies EstimatedTronTxInstantFeeAcceptedAssetsInner;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EstimatedTronTxInstantFeeAcceptedAssetsInner;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
