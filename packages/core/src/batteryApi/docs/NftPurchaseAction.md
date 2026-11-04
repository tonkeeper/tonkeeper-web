# NftPurchaseAction

## Properties

| Name          | Type                                |
| ------------- | ----------------------------------- |
| `auctionType` | string                              |
| `amount`      | [Price](Price.md)                   |
| `nft`         | [NftItem](NftItem.md)               |
| `seller`      | [AccountAddress](AccountAddress.md) |
| `buyer`       | [AccountAddress](AccountAddress.md) |

## Example

```typescript
import type { NftPurchaseAction } from '';

// TODO: Update the object below with actual values
const example = {
    auctionType: null,
    amount: null,
    nft: null,
    seller: null,
    buyer: null
} satisfies NftPurchaseAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as NftPurchaseAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
