# SetSignatureAllowedAction

## Properties

| Name      | Type                                |
| --------- | ----------------------------------- |
| `wallet`  | [AccountAddress](AccountAddress.md) |
| `allowed` | boolean                             |

## Example

```typescript
import type { SetSignatureAllowedAction } from '';

// TODO: Update the object below with actual values
const example = {
    wallet: null,
    allowed: null
} satisfies SetSignatureAllowedAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SetSignatureAllowedAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
