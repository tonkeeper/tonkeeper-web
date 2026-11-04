# WithdrawXTRAction

## Properties

| Name     | Type                                |
| -------- | ----------------------------------- |
| `user`   | [AccountAddress](AccountAddress.md) |
| `amount` | string                              |

## Example

```typescript
import type { WithdrawXTRAction } from '';

// TODO: Update the object below with actual values
const example = {
    user: null,
    amount: 123000000000
} satisfies WithdrawXTRAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WithdrawXTRAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
