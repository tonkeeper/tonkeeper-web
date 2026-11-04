# NftItem

## Properties

| Name          | Type                                         |
| ------------- | -------------------------------------------- |
| `address`     | string                                       |
| `index`       | number                                       |
| `owner`       | [AccountAddress](AccountAddress.md)          |
| `collection`  | [NftItemCollection](NftItemCollection.md)    |
| `verified`    | boolean                                      |
| `metadata`    | { [key: string]: any; }                      |
| `sale`        | [Sale](Sale.md)                              |
| `previews`    | [Array&lt;ImagePreview&gt;](ImagePreview.md) |
| `dns`         | string                                       |
| `approvedBy`  | Array&lt;string&gt;                          |
| `includeCnft` | boolean                                      |
| `trust`       | [TrustType](TrustType.md)                    |
| `codeHash`    | string                                       |
| `dataHash`    | string                                       |

## Example

```typescript
import type { NftItem } from ''

// TODO: Update the object below with actual values
const example = {
  "address": 0:E93E7D444180608B8520C00DC664383A387356FB6E16FDDF99DBE5E1415A574B,
  "index": 58,
  "owner": null,
  "collection": null,
  "verified": true,
  "metadata": {},
  "sale": null,
  "previews": null,
  "dns": crypto.ton,
  "approvedBy": null,
  "includeCnft": false,
  "trust": null,
  "codeHash": null,
  "dataHash": null,
} satisfies NftItem

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as NftItem
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
