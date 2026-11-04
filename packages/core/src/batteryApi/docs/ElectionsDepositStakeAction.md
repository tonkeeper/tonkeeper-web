# ElectionsDepositStakeAction

## Properties

| Name     | Type                                |
| -------- | ----------------------------------- |
| `amount` | number                              |
| `staker` | [AccountAddress](AccountAddress.md) |

## Example

```typescript
import type { ElectionsDepositStakeAction } from '';

// TODO: Update the object below with actual values
const example = {
    amount: 1660050553,
    staker: null
} satisfies ElectionsDepositStakeAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ElectionsDepositStakeAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
