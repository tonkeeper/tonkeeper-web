# DomainRenewAction

## Properties

| Name              | Type                                |
| ----------------- | ----------------------------------- |
| `domain`          | string                              |
| `contractAddress` | string                              |
| `renewer`         | [AccountAddress](AccountAddress.md) |

## Example

```typescript
import type { DomainRenewAction } from ''

// TODO: Update the object below with actual values
const example = {
  "domain": vasya.ton,
  "contractAddress": 0:da6b1b6663a0e4d18cc8574ccd9db5296e367dd9324706f3bbd9eb1cd2caf0bf,
  "renewer": null,
} satisfies DomainRenewAction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as DomainRenewAction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
