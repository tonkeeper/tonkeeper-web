# EstimatedTronTxInstantFee

## Properties

| Name             | Type                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| `feeAddress`     | string                                                                                                       |
| `acceptedAssets` | [Array&lt;EstimatedTronTxInstantFeeAcceptedAssetsInner&gt;](EstimatedTronTxInstantFeeAcceptedAssetsInner.md) |

## Example

```typescript
import type { EstimatedTronTxInstantFee } from '';

// TODO: Update the object below with actual values
const example = {
    feeAddress: null,
    acceptedAssets: null
} satisfies EstimatedTronTxInstantFee;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EstimatedTronTxInstantFee;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
