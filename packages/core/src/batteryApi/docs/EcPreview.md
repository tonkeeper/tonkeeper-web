# EcPreview

## Properties

| Name       | Type   |
| ---------- | ------ |
| `id`       | number |
| `symbol`   | string |
| `decimals` | number |
| `image`    | string |

## Example

```typescript
import type { EcPreview } from ''

// TODO: Update the object below with actual values
const example = {
  "id": 239,
  "symbol": FMS,
  "decimals": 5,
  "image": https://cache.tonapi.io/images/extra.jpg,
} satisfies EcPreview

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as EcPreview
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
