# ConfigTransferCostJettonsInner

## Properties

| Name           | Type   |
| -------------- | ------ |
| `jettonMaster` | string |
| `symbol`       | string |
| `value`        | string |

## Example

```typescript
import type { ConfigTransferCostJettonsInner } from ''

// TODO: Update the object below with actual values
const example = {
  "jettonMaster": null,
  "symbol": USD₮,
  "value": 0.002,
} satisfies ConfigTransferCostJettonsInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ConfigTransferCostJettonsInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
