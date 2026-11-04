# RechargeMethodsMethodsInner

## Properties

| Name                | Type    |
| ------------------- | ------- |
| `image`             | string  |
| `jettonMaster`      | string  |
| `minBootstrapValue` | string  |
| `type`              | string  |
| `rate`              | string  |
| `symbol`            | string  |
| `decimals`          | number  |
| `supportGasless`    | boolean |
| `supportRecharge`   | boolean |

## Example

```typescript
import type { RechargeMethodsMethodsInner } from ''

// TODO: Update the object below with actual values
const example = {
  "image": https://example.com/image.png,
  "jettonMaster": null,
  "minBootstrapValue": 10.0,
  "type": null,
  "rate": 10.250,
  "symbol": usdt,
  "decimals": 6,
  "supportGasless": true,
  "supportRecharge": true,
} satisfies RechargeMethodsMethodsInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RechargeMethodsMethodsInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
