# FlawedJettonTransferAction

## Properties

| Name               | Type                                    |
| ------------------ | --------------------------------------- |
| `sender`           | [AccountAddress](AccountAddress.md)     |
| `recipient`        | [AccountAddress](AccountAddress.md)     |
| `sendersWallet`    | string                                  |
| `recipientsWallet` | string                                  |
| `sentAmount`       | string                                  |
| `receivedAmount`   | string                                  |
| `comment`          | string                                  |
| `encryptedComment` | [EncryptedComment](EncryptedComment.md) |
| `refund`           | [Refund](Refund.md)                     |
| `jetton`           | [JettonPreview](JettonPreview.md)       |

## Example

```typescript
import type { FlawedJettonTransferAction } from ''

// TODO: Update the object below with actual values
const example = {
  "sender": null,
  "recipient": null,
  "sendersWallet": 0:E93E7D444180608B8520C00DC664383A387356FB6E16FDDF99DBE5E1415A574B,
  "recipientsWallet": 0:E93E7D444180608B8520C00DC664383A387356FB6E16FDDF99DBE5E1415A574B,
  "sentAmount": 1000000000,
  "receivedAmount": 1000000000,
  "comment": Hi! This is your salary.
From accounting with love.,
  "encryptedComment": null,
  "refund": null,
  "jetton": null,
} satisfies FlawedJettonTransferAction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FlawedJettonTransferAction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
