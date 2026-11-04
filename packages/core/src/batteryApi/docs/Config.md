# Config

## Properties

| Name                    | Type                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `chargeCost`            | string                                                     |
| `fundReceiver`          | string                                                     |
| `excessAccount`         | string                                                     |
| `messageTtl`            | number                                                     |
| `gasProxy`              | [Array&lt;ConfigGasProxyInner&gt;](ConfigGasProxyInner.md) |
| `meanPrices`            | [ConfigMeanPrices](ConfigMeanPrices.md)                    |
| `batteryReservedAmount` | string                                                     |
| `packages`              | [Array&lt;PackageItem&gt;](PackageItem.md)                 |
| `transferCost`          | [ConfigTransferCost](ConfigTransferCost.md)                |

## Example

```typescript
import type { Config } from ''

// TODO: Update the object below with actual values
const example = {
  "chargeCost": 0.0026,
  "fundReceiver": 0:07331e629e39d006d86a8cc7659c10a97c671f7535dc8b7f251a1a944dda348e,
  "excessAccount": 0:da6b1b6663a0e4d18cc8574ccd9db5296e367dd9324706f3bbd9eb1cd2caf0bf,
  "messageTtl": 300,
  "gasProxy": null,
  "meanPrices": null,
  "batteryReservedAmount": 0.065,
  "packages": null,
  "transferCost": null,
} satisfies Config

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Config
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
