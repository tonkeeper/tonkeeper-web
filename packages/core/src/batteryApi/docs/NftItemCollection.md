# NftItemCollection

## Properties

| Name          | Type   |
| ------------- | ------ |
| `address`     | string |
| `name`        | string |
| `description` | string |

## Example

```typescript
import type { NftItemCollection } from ''

// TODO: Update the object below with actual values
const example = {
  "address": 0:E93E7D444180608B8520C00DC664383A387356FB6E16FDDF99DBE5E1415A574B,
  "name": TON Diamonds,
  "description": Best collection in TON network,
} satisfies NftItemCollection

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as NftItemCollection
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
