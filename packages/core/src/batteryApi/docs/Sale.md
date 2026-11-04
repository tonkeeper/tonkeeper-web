# Sale

## Properties

| Name      | Type                                |
| --------- | ----------------------------------- |
| `address` | string                              |
| `market`  | [AccountAddress](AccountAddress.md) |
| `owner`   | [AccountAddress](AccountAddress.md) |
| `price`   | [Price](Price.md)                   |

## Example

```typescript
import type { Sale } from ''

// TODO: Update the object below with actual values
const example = {
  "address": 0:10C1073837B93FDAAD594284CE8B8EFF7B9CF25427440EB2FC682762E1471365,
  "market": null,
  "owner": null,
  "price": null,
} satisfies Sale

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Sale
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
