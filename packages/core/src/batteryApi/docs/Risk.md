# Risk

Conservative upper bound on assets this wallet may lose if the emulated message is sent and the
counterparty behaves maliciously. Values may exceed current balances (e.g. already-authorized future
receipts). For UI display only.

## Properties

| Name                          | Type                                             |
| ----------------------------- | ------------------------------------------------ |
| `transferAllRemainingBalance` | boolean                                          |
| `ton`                         | number                                           |
| `gram`                        | number                                           |
| `jettons`                     | [Array&lt;JettonQuantity&gt;](JettonQuantity.md) |
| `nfts`                        | [Array&lt;NftItem&gt;](NftItem.md)               |
| `totalEquivalent`             | number                                           |

## Example

```typescript
import type { Risk } from '';

// TODO: Update the object below with actual values
const example = {
    transferAllRemainingBalance: true,
    ton: 500,
    gram: 500,
    jettons: null,
    nfts: null,
    totalEquivalent: null
} satisfies Risk;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Risk;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
