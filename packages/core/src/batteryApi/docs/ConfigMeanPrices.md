# ConfigMeanPrices

## Properties

| Name                       | Type   |
| -------------------------- | ------ |
| `batteryMeanPriceSwap`     | number |
| `batteryMeanPriceJetton`   | number |
| `batteryMeanPriceNft`      | number |
| `batteryMeanPriceTronUsdt` | number |
| `tonMeanPriceTronUsdt`     | number |

## Example

```typescript
import type { ConfigMeanPrices } from '';

// TODO: Update the object below with actual values
const example = {
    batteryMeanPriceSwap: null,
    batteryMeanPriceJetton: null,
    batteryMeanPriceNft: null,
    batteryMeanPriceTronUsdt: null,
    tonMeanPriceTronUsdt: null
} satisfies ConfigMeanPrices;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ConfigMeanPrices;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
