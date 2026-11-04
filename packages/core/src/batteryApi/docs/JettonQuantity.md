# JettonQuantity

## Properties

| Name            | Type                                |
| --------------- | ----------------------------------- |
| `quantity`      | string                              |
| `walletAddress` | [AccountAddress](AccountAddress.md) |
| `jetton`        | [JettonPreview](JettonPreview.md)   |

## Example

```typescript
import type { JettonQuantity } from '';

// TODO: Update the object below with actual values
const example = {
    quantity: 597968399,
    walletAddress: null,
    jetton: null
} satisfies JettonQuantity;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as JettonQuantity;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
