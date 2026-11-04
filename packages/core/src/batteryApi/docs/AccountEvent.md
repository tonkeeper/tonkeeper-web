# AccountEvent

High-level view over a transaction trace caused by a single inbound message. TonAPI analyses the
trace, detects known patterns and groups low-level transactions into user-facing actions (Jetton
transfer, NFT purchase, etc.). Actions are a best-effort UI abstraction and may change; do not rely
on them for protocol-critical logic.

## Properties

| Name         | Type                                |
| ------------ | ----------------------------------- |
| `eventId`    | string                              |
| `account`    | [AccountAddress](AccountAddress.md) |
| `timestamp`  | number                              |
| `actions`    | [Array&lt;Action&gt;](Action.md)    |
| `isScam`     | boolean                             |
| `lt`         | number                              |
| `inProgress` | boolean                             |
| `extra`      | number                              |
| `progress`   | number                              |
| `extMsgHash` | string                              |

## Example

```typescript
import type { AccountEvent } from '';

// TODO: Update the object below with actual values
const example = {
    eventId: e8b0e3fee4a26bd2317ac1f9952fcdc87dc08fdb617656b5202416323337372e,
    account: null,
    timestamp: 1234567890,
    actions: null,
    isScam: false,
    lt: 25713146000001,
    inProgress: false,
    extra: 3,
    progress: 0.5,
    extMsgHash: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
} satisfies AccountEvent;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AccountEvent;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
