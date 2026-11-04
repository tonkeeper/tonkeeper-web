# MessageConsequences

Result of emulating a wallet message on the current blockchain state: describes the expected
on-chain consequences (trace, high-level AccountEvent, risk) for the signing wallet. For UI display
only.

## Properties

| Name    | Type                            |
| ------- | ------------------------------- |
| `trace` | [Trace](Trace.md)               |
| `risk`  | [Risk](Risk.md)                 |
| `event` | [AccountEvent](AccountEvent.md) |

## Example

```typescript
import type { MessageConsequences } from '';

// TODO: Update the object below with actual values
const example = {
    trace: null,
    risk: null,
    event: null
} satisfies MessageConsequences;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MessageConsequences;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
