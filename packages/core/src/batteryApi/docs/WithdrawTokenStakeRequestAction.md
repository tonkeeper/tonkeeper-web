# WithdrawTokenStakeRequestAction

## Properties

| Name        | Type                                |
| ----------- | ----------------------------------- |
| `staker`    | [AccountAddress](AccountAddress.md) |
| `protocol`  | [Protocol](Protocol.md)             |
| `stakeMeta` | [Price](Price.md)                   |

## Example

```typescript
import type { WithdrawTokenStakeRequestAction } from '';

// TODO: Update the object below with actual values
const example = {
    staker: null,
    protocol: null,
    stakeMeta: null
} satisfies WithdrawTokenStakeRequestAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WithdrawTokenStakeRequestAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
