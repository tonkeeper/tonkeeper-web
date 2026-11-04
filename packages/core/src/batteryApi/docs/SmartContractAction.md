# SmartContractAction

## Properties

| Name           | Type                                |
| -------------- | ----------------------------------- |
| `executor`     | [AccountAddress](AccountAddress.md) |
| `contract`     | [AccountAddress](AccountAddress.md) |
| `tonAttached`  | number                              |
| `gramAttached` | number                              |
| `operation`    | string                              |
| `payload`      | string                              |
| `refund`       | [Refund](Refund.md)                 |

## Example

```typescript
import type { SmartContractAction } from ''

// TODO: Update the object below with actual values
const example = {
  "executor": null,
  "contract": null,
  "tonAttached": 123456789,
  "gramAttached": 123456789,
  "operation": NftTransfer or 0x35d95a12,
  "payload": null,
  "refund": null,
} satisfies SmartContractAction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as SmartContractAction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
