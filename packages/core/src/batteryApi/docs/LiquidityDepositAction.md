# LiquidityDepositAction

## Properties

| Name       | Type                                                 |
| ---------- | ---------------------------------------------------- |
| `protocol` | [Protocol](Protocol.md)                              |
| `from`     | [AccountAddress](AccountAddress.md)                  |
| `tokens`   | [Array&lt;VaultDepositInfo&gt;](VaultDepositInfo.md) |

## Example

```typescript
import type { LiquidityDepositAction } from '';

// TODO: Update the object below with actual values
const example = {
    protocol: null,
    from: null,
    tokens: null
} satisfies LiquidityDepositAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as LiquidityDepositAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
