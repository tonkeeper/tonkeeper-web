# EncryptedComment

## Properties

| Name             | Type   |
| ---------------- | ------ |
| `encryptionType` | string |
| `cipherText`     | string |

## Example

```typescript
import type { EncryptedComment } from ''

// TODO: Update the object below with actual values
const example = {
  "encryptionType": simple,
  "cipherText": A6A0BD6608672B...CE3AF8DB,
} satisfies EncryptedComment

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EncryptedComment
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
