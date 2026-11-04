# JettonSwapAction

## Properties

| Name              | Type                                |
| ----------------- | ----------------------------------- |
| `dex`             | string                              |
| `amountIn`        | string                              |
| `amountOut`       | string                              |
| `tonIn`           | number                              |
| `tonOut`          | number                              |
| `gramIn`          | number                              |
| `gramOut`         | number                              |
| `userWallet`      | [AccountAddress](AccountAddress.md) |
| `router`          | [AccountAddress](AccountAddress.md) |
| `jettonMasterIn`  | [JettonPreview](JettonPreview.md)   |
| `jettonMasterOut` | [JettonPreview](JettonPreview.md)   |

## Example

```typescript
import type { JettonSwapAction } from '';

// TODO: Update the object below with actual values
const example = {
    dex: stonfi,
    amountIn: 1660050553,
    amountOut: 1660050553,
    tonIn: 1000000000,
    tonOut: 2000000000,
    gramIn: 1000000000,
    gramOut: 2000000000,
    userWallet: null,
    router: null,
    jettonMasterIn: null,
    jettonMasterOut: null
} satisfies JettonSwapAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as JettonSwapAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
