# TronTransactionsListTransactionsInner

## Properties

| Name             | Type    |
| ---------------- | ------- |
| `txid`           | string  |
| `fromAccount`    | string  |
| `toAccount`      | string  |
| `amount`         | string  |
| `isPending`      | boolean |
| `isFailed`       | boolean |
| `batteryCharges` | number  |
| `timestamp`      | number  |
| `trongridResult` | number  |
| `feeType`        | string  |
| `feeTonNano`     | number  |
| `isFreePro`      | boolean |

## Example

```typescript
import type { TronTransactionsListTransactionsInner } from '';

// TODO: Update the object below with actual values
const example = {
    txid: null,
    fromAccount: null,
    toAccount: null,
    amount: null,
    isPending: null,
    isFailed: null,
    batteryCharges: null,
    timestamp: null,
    trongridResult: null,
    feeType: null,
    feeTonNano: null,
    isFreePro: null
} satisfies TronTransactionsListTransactionsInner;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TronTransactionsListTransactionsInner;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
