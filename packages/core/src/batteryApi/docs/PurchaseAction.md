# PurchaseAction

## Properties

| Name          | Type                                |
| ------------- | ----------------------------------- |
| `source`      | [AccountAddress](AccountAddress.md) |
| `destination` | [AccountAddress](AccountAddress.md) |
| `invoiceId`   | string                              |
| `amount`      | [Price](Price.md)                   |
| `metadata`    | [Metadata](Metadata.md)             |

## Example

```typescript
import type { PurchaseAction } from ''

// TODO: Update the object below with actual values
const example = {
  "source": null,
  "destination": null,
  "invoiceId": 03cfc582-b1c3-410a-a9a7-1f3afe326b3b,
  "amount": null,
  "metadata": null,
} satisfies PurchaseAction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PurchaseAction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
