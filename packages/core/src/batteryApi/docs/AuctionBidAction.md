# AuctionBidAction

## Properties

| Name          | Type                                |
| ------------- | ----------------------------------- |
| `auctionType` | string                              |
| `amount`      | [Price](Price.md)                   |
| `nft`         | [NftItem](NftItem.md)               |
| `bidder`      | [AccountAddress](AccountAddress.md) |
| `auction`     | [AccountAddress](AccountAddress.md) |

## Example

```typescript
import type { AuctionBidAction } from '';

// TODO: Update the object below with actual values
const example = {
    auctionType: null,
    amount: null,
    nft: null,
    bidder: null,
    auction: null
} satisfies AuctionBidAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AuctionBidAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
