# SendMessageRequest

## Properties

| Name    | Type   |
| ------- | ------ |
| `boc`   | string |
| `proof` | string |

## Example

```typescript
import type { SendMessageRequest } from ''

// TODO: Update the object below with actual values
const example = {
  "boc": te6ccgECBQEAARUAAkWIAWTtae+KgtbrX26Bep8JSq8lFLfGOoyGR/xwdjfvpvEaHg,
  "proof": 3a7f1c9e00000000000000000000000000000000000000000000000000000000d204a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90,
} satisfies SendMessageRequest

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SendMessageRequest
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
