# ContractDeployAction

## Properties

| Name         | Type                |
| ------------ | ------------------- |
| `address`    | string              |
| `interfaces` | Array&lt;string&gt; |

## Example

```typescript
import type { ContractDeployAction } from ''

// TODO: Update the object below with actual values
const example = {
  "address": 0:da6b1b6663a0e4d18cc8574ccd9db5296e367dd9324706f3bbd9eb1cd2caf0bf,
  "interfaces": ["nft_item","nft_royalty"],
} satisfies ContractDeployAction

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as ContractDeployAction
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
