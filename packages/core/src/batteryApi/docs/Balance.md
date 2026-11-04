# Balance

## Properties

| Name       | Type   |
| ---------- | ------ |
| `balance`  | string |
| `reserved` | string |
| `units`    | string |

## Example

```typescript
import type { Balance } from '';

// TODO: Update the object below with actual values
const example = {
    balance: 10.25,
    reserved: 0.3,
    units: usd
} satisfies Balance;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Balance;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
