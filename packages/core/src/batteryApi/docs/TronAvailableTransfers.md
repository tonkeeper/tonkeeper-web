# TronAvailableTransfers

## Properties

| Name                 | Type   |
| -------------------- | ------ |
| `availableTransfers` | number |
| `type`               | string |
| `nextResetDate`      | number |

## Example

```typescript
import type { TronAvailableTransfers } from '';

// TODO: Update the object below with actual values
const example = {
    availableTransfers: 3,
    type: inactive,
    nextResetDate: 1678275313
} satisfies TronAvailableTransfers;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as TronAvailableTransfers;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
