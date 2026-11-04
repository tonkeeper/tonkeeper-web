# ExtraCurrencyTransferAction

## Properties

| Name               | Type                                    |
| ------------------ | --------------------------------------- |
| `sender`           | [AccountAddress](AccountAddress.md)     |
| `recipient`        | [AccountAddress](AccountAddress.md)     |
| `amount`           | string                                  |
| `comment`          | string                                  |
| `encryptedComment` | [EncryptedComment](EncryptedComment.md) |
| `currency`         | [EcPreview](EcPreview.md)               |

## Example

```typescript
import type { ExtraCurrencyTransferAction } from ''

// TODO: Update the object below with actual values
const example = {
  "sender": null,
  "recipient": null,
  "amount": 1000000000,
  "comment": Hi! This is your salary.
From accounting with love.,
  "encryptedComment": null,
  "currency": null,
} satisfies ExtraCurrencyTransferAction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ExtraCurrencyTransferAction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
