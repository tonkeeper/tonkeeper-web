# ActionPhase

## Properties

| Name                    | Type    |
| ----------------------- | ------- |
| `success`               | boolean |
| `resultCode`            | number  |
| `totalActions`          | number  |
| `skippedActions`        | number  |
| `fwdFees`               | number  |
| `totalFees`             | number  |
| `resultCodeDescription` | string  |

## Example

```typescript
import type { ActionPhase } from '';

// TODO: Update the object below with actual values
const example = {
    success: true,
    resultCode: 5,
    totalActions: 5,
    skippedActions: 5,
    fwdFees: 1000,
    totalFees: 1000,
    resultCodeDescription: null
} satisfies ActionPhase;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ActionPhase;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
