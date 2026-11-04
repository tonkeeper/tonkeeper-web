# GasRelayFee

## Properties

| Name     | Type                              |
| -------- | --------------------------------- |
| `jetton` | [JettonPreview](JettonPreview.md) |
| `amount` | string                            |

## Example

```typescript
import type { GasRelayFee } from '';

// TODO: Update the object below with actual values
const example = {
    jetton: null,
    amount: 1000000000
} satisfies GasRelayFee;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GasRelayFee;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
