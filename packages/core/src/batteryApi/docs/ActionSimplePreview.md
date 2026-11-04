# ActionSimplePreview

shortly describes what this action is about.

## Properties

| Name          | Type                                             |
| ------------- | ------------------------------------------------ |
| `name`        | string                                           |
| `description` | string                                           |
| `actionImage` | string                                           |
| `value`       | string                                           |
| `fiatValue`   | string                                           |
| `valueImage`  | string                                           |
| `accounts`    | [Array&lt;AccountAddress&gt;](AccountAddress.md) |

## Example

```typescript
import type { ActionSimplePreview } from ''

// TODO: Update the object below with actual values
const example = {
  "name": Gram Transfer,
  "description": Transferring 5 Gram,
  "actionImage": null,
  "value": 5 Gram,
  "fiatValue": 4.99 USD,
  "valueImage": null,
  "accounts": null,
} satisfies ActionSimplePreview

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ActionSimplePreview
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
