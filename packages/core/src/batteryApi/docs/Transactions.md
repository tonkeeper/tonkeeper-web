# Transactions

## Properties

| Name                | Type                                                                           |
| ------------------- | ------------------------------------------------------------------------------ |
| `totalTransactions` | number                                                                         |
| `nextOffset`        | number                                                                         |
| `transactions`      | [Array&lt;TransactionsTransactionsInner&gt;](TransactionsTransactionsInner.md) |

## Example

```typescript
import type { Transactions } from '';

// TODO: Update the object below with actual values
const example = {
    totalTransactions: 1,
    nextOffset: 10,
    transactions: null
} satisfies Transactions;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Transactions;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
