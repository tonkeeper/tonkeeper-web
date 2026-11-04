# OraclePriceFeed

## Properties

| Name            | Type   |
| --------------- | ------ |
| `id`            | string |
| `displaySymbol` | string |
| `rate`          | number |

## Example

```typescript
import type { OraclePriceFeed } from '';

// TODO: Update the object below with actual values
const example = {
    id: e62df6c8b4a85fe1a67f1c4d1f1e1d4335c04d1d7e2c50e0d7da7ad911f2d4,
    displaySymbol: GRAM / USD,
    rate: 5.24
} satisfies OraclePriceFeed;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OraclePriceFeed;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
