# TonConnectProofRequest

## Properties

| Name      | Type                                                          |
| --------- | ------------------------------------------------------------- |
| `address` | string                                                        |
| `proof`   | [TonConnectProofRequestProof](TonConnectProofRequestProof.md) |

## Example

```typescript
import type { TonConnectProofRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "address": 0:97146a46acc2654y27947f14c4a4b14273e954f78bc017790b41208b0043200b,
  "proof": null,
} satisfies TonConnectProofRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TonConnectProofRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
