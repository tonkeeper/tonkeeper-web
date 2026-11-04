# JettonBurnAction

## Properties

| Name            | Type                                |
| --------------- | ----------------------------------- |
| `sender`        | [AccountAddress](AccountAddress.md) |
| `sendersWallet` | string                              |
| `amount`        | string                              |
| `jetton`        | [JettonPreview](JettonPreview.md)   |

## Example

```typescript
import type { JettonBurnAction } from ''

// TODO: Update the object below with actual values
const example = {
  "sender": null,
  "sendersWallet": 0:E93E7D444180608B8520C00DC664383A387356FB6E16FDDF99DBE5E1415A574B,
  "amount": 1000000000,
  "jetton": null,
} satisfies JettonBurnAction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as JettonBurnAction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
