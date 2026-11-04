# Transaction

## Properties

| Name              | Type                                  |
| ----------------- | ------------------------------------- |
| `hash`            | string                                |
| `lt`              | number                                |
| `account`         | [AccountAddress](AccountAddress.md)   |
| `success`         | boolean                               |
| `utime`           | number                                |
| `origStatus`      | [AccountStatus](AccountStatus.md)     |
| `endStatus`       | [AccountStatus](AccountStatus.md)     |
| `totalFees`       | number                                |
| `endBalance`      | number                                |
| `transactionType` | [TransactionType](TransactionType.md) |
| `stateUpdateOld`  | string                                |
| `stateUpdateNew`  | string                                |
| `inMsg`           | [Message](Message.md)                 |
| `outMsgs`         | [Array&lt;Message&gt;](Message.md)    |
| `block`           | string                                |
| `prevTransHash`   | string                                |
| `prevTransLt`     | number                                |
| `computePhase`    | [ComputePhase](ComputePhase.md)       |
| `storagePhase`    | [StoragePhase](StoragePhase.md)       |
| `creditPhase`     | [CreditPhase](CreditPhase.md)         |
| `actionPhase`     | [ActionPhase](ActionPhase.md)         |
| `bouncePhase`     | [BouncePhaseType](BouncePhaseType.md) |
| `aborted`         | boolean                               |
| `destroyed`       | boolean                               |
| `raw`             | string                                |

## Example

```typescript
import type { Transaction } from ''

// TODO: Update the object below with actual values
const example = {
  "hash": 55e8809519cd3c49098c9ee45afdafcea7a894a74d0f628d94a115a50e045122,
  "lt": 25713146000001,
  "account": null,
  "success": true,
  "utime": 1645544908,
  "origStatus": null,
  "endStatus": null,
  "totalFees": 25713146000001,
  "endBalance": 25713146000001,
  "transactionType": null,
  "stateUpdateOld": 55e8809519cd3c49098c9ee45afdafcea7a894a74d0f628d94a115a50e045122,
  "stateUpdateNew": 55e8809519cd3c49098c9ee45afdafcea7a894a74d0f628d94a115a50e045122,
  "inMsg": null,
  "outMsgs": null,
  "block": (-1,4234234,8000000000000000),
  "prevTransHash": 55e8809519cd3c49098c9ee45afdafcea7a894a74d0f628d94a115a50e045122,
  "prevTransLt": 25713146000001,
  "computePhase": null,
  "storagePhase": null,
  "creditPhase": null,
  "actionPhase": null,
  "bouncePhase": null,
  "aborted": true,
  "destroyed": true,
  "raw": b5ee9c72410206010001380003b372cf3b5b8c891e517c9addbda1c0386a09ccacbb0e3faf630b51cfc8152325acb00002ac5795c0e41fdf79135cb7da03cc623b165d614b562a51eeccd8a5e097f405abf6b37f4e73000002ac5629732c1666887ed000144030480102030101a004008272abc8f2971aa4404ac6da1597720f348b2e1247b1ad9f55cbd3b6812f0a5f08b269bb65039fb1f6074d00f794e857f6dfd01131d299df456af10a8a4943d4d165000d0c80608840492001ab48015581f575c3b8c6ab3d6,
} satisfies Transaction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Transaction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
