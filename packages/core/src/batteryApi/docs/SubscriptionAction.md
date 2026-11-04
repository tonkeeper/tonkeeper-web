# SubscriptionAction

## Properties

| Name           | Type                                |
| -------------- | ----------------------------------- |
| `subscriber`   | [AccountAddress](AccountAddress.md) |
| `subscription` | string                              |
| `beneficiary`  | [AccountAddress](AccountAddress.md) |
| `admin`        | [AccountAddress](AccountAddress.md) |
| `amount`       | number                              |
| `price`        | [Price](Price.md)                   |
| `initial`      | boolean                             |

## Example

```typescript
import type { SubscriptionAction } from ''

// TODO: Update the object below with actual values
const example = {
  "subscriber": null,
  "subscription": 0:da6b1b6663a0e4d18cc8574ccd9db5296e367dd9324706f3bbd9eb1cd2caf0bf,
  "beneficiary": null,
  "admin": null,
  "amount": 1000000000,
  "price": null,
  "initial": false,
} satisfies SubscriptionAction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SubscriptionAction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
