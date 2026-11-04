# JettonPreview

## Properties

| Name                  | Type                                                |
| --------------------- | --------------------------------------------------- |
| `address`             | string                                              |
| `name`                | string                                              |
| `symbol`              | string                                              |
| `decimals`            | number                                              |
| `image`               | string                                              |
| `verification`        | [JettonVerificationType](JettonVerificationType.md) |
| `customPayloadApiUri` | string                                              |
| `score`               | number                                              |
| `scaledUi`            | [ScaledUI](ScaledUI.md)                             |
| `description`         | string                                              |

## Example

```typescript
import type { JettonPreview } from ''

// TODO: Update the object below with actual values
const example = {
  "address": 0:0BB5A9F69043EEBDDA5AD2E946EB953242BD8F603FE795D90698CEEC6BFC60A0,
  "name": Wrapped TON,
  "symbol": WTON,
  "decimals": 9,
  "image": https://cache.tonapi.io/images/jetton.jpg,
  "verification": null,
  "customPayloadApiUri": null,
  "score": null,
  "scaledUi": null,
  "description": null,
} satisfies JettonPreview

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as JettonPreview
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
