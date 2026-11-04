# ExtraCurrency

## Properties

| Name      | Type                      |
| --------- | ------------------------- |
| `amount`  | string                    |
| `preview` | [EcPreview](EcPreview.md) |

## Example

```typescript
import type { ExtraCurrency } from '';

// TODO: Update the object below with actual values
const example = {
    amount: 1000000000,
    preview: null
} satisfies ExtraCurrency;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ExtraCurrency;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
