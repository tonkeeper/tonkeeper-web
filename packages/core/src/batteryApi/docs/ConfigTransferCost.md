# ConfigTransferCost

## Properties

| Name       | Type                                                                             |
| ---------- | -------------------------------------------------------------------------------- |
| `_default` | string                                                                           |
| `jettons`  | [Array&lt;ConfigTransferCostJettonsInner&gt;](ConfigTransferCostJettonsInner.md) |

## Example

```typescript
import type { ConfigTransferCost } from '';

// TODO: Update the object below with actual values
const example = {
    _default: 0.05,
    jettons: null
} satisfies ConfigTransferCost;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ConfigTransferCost;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
