# AddExtensionAction

## Properties

| Name        | Type                                |
| ----------- | ----------------------------------- |
| `wallet`    | [AccountAddress](AccountAddress.md) |
| `extension` | string                              |

## Example

```typescript
import type { AddExtensionAction } from ''

// TODO: Update the object below with actual values
const example = {
  "wallet": null,
  "extension": 0:10C1073837B93FDAAD594284CE8B8EFF7B9CF25427440EB2FC682762E1471365,
} satisfies AddExtensionAction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AddExtensionAction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
