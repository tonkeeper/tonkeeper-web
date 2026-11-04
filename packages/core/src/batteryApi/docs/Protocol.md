# Protocol

## Properties

| Name    | Type   |
| ------- | ------ |
| `name`  | string |
| `image` | string |

## Example

```typescript
import type { Protocol } from ''

// TODO: Update the object below with actual values
const example = {
  "name": Ethena,
  "image": https://cache.tonapi.io/images/jetton.jpg,
} satisfies Protocol

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Protocol
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
