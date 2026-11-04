# WithdrawStakeAction

validator\'s participation in elections

## Properties

| Name             | Type                                                |
| ---------------- | --------------------------------------------------- |
| `amount`         | number                                              |
| `staker`         | [AccountAddress](AccountAddress.md)                 |
| `pool`           | [AccountAddress](AccountAddress.md)                 |
| `implementation` | [PoolImplementationType](PoolImplementationType.md) |

## Example

```typescript
import type { WithdrawStakeAction } from '';

// TODO: Update the object below with actual values
const example = {
    amount: 1660050553,
    staker: null,
    pool: null,
    implementation: null
} satisfies WithdrawStakeAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WithdrawStakeAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
