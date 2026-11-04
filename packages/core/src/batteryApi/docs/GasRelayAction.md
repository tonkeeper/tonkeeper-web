# GasRelayAction

## Properties

| Name         | Type                                |
| ------------ | ----------------------------------- |
| `amount`     | number                              |
| `relayer`    | [AccountAddress](AccountAddress.md) |
| `target`     | [AccountAddress](AccountAddress.md) |
| `isBattery`  | boolean                             |
| `relayerFee` | [GasRelayFee](GasRelayFee.md)       |

## Example

```typescript
import type { GasRelayAction } from '';

// TODO: Update the object below with actual values
const example = {
    amount: 1000000000,
    relayer: null,
    target: null,
    isBattery: null,
    relayerFee: null
} satisfies GasRelayAction;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GasRelayAction;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
