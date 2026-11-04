# TonConnectProofRequestProof

## Properties

| Name        | Type                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| `timestamp` | number                                                                    |
| `domain`    | [TonConnectProofRequestProofDomain](TonConnectProofRequestProofDomain.md) |
| `signature` | string                                                                    |
| `payload`   | string                                                                    |
| `stateInit` | string                                                                    |

## Example

```typescript
import type { TonConnectProofRequestProof } from ''

// TODO: Update the object below with actual values
const example = {
  "timestamp": 1678275313,
  "domain": null,
  "signature": null,
  "payload": 84jHVNLQmZsAAAAAZB0Zryi2wqVJI-KaKNXOvCijEi46YyYzkaSHyJrMPBMOkVZa,
  "stateInit": null,
} satisfies TonConnectProofRequestProof

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TonConnectProofRequestProof
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
