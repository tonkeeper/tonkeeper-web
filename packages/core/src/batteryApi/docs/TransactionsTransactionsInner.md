# TransactionsTransactionsInner

## Properties

| Name         | Type   |
| ------------ | ------ |
| `id`         | string |
| `paidAmount` | string |
| `status`     | string |
| `createdAt`  | string |

## Example

```typescript
import type { TransactionsTransactionsInner } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "paidAmount": 10.250,
  "status": 10.250,
  "createdAt": 2006-01-02T15:04:05Z07:00,
} satisfies TransactionsTransactionsInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TransactionsTransactionsInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
