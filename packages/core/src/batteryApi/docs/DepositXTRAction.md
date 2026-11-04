# DepositXTRAction

## Properties

| Name        | Type                                |
| ----------- | ----------------------------------- |
| `recipient` | [AccountAddress](AccountAddress.md) |
| `amount`    | string                              |

## Example

```typescript
import type { DepositXTRAction } from '';

// TODO: Update the object below with actual values
const example = {
    recipient: null,
    amount: 123000000000
} satisfies DepositXTRAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DepositXTRAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
