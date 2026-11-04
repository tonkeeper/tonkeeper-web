# NftItemTransferAction

## Properties

| Name               | Type                                    |
| ------------------ | --------------------------------------- |
| `sender`           | [AccountAddress](AccountAddress.md)     |
| `recipient`        | [AccountAddress](AccountAddress.md)     |
| `nft`              | string                                  |
| `comment`          | string                                  |
| `encryptedComment` | [EncryptedComment](EncryptedComment.md) |
| `payload`          | string                                  |
| `refund`           | [Refund](Refund.md)                     |

## Example

```typescript
import type { NftItemTransferAction } from ''

// TODO: Update the object below with actual values
const example = {
  "sender": null,
  "recipient": null,
  "nft": ,
  "comment": Hi! This is your salary.
From accounting with love.,
  "encryptedComment": null,
  "payload": 0234de3e21d21b3ee21f3,
  "refund": null,
} satisfies NftItemTransferAction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as NftItemTransferAction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
