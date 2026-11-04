# Trace

## Properties

| Name          | Type                           |
| ------------- | ------------------------------ |
| `transaction` | [Transaction](Transaction.md)  |
| `interfaces`  | Array&lt;string&gt;            |
| `children`    | [Array&lt;Trace&gt;](Trace.md) |
| `emulated`    | boolean                        |

## Example

```typescript
import type { Trace } from '';

// TODO: Update the object below with actual values
const example = {
    transaction: null,
    interfaces: ['wallet', 'tep62_item'],
    children: null,
    emulated: false
} satisfies Trace;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Trace;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
