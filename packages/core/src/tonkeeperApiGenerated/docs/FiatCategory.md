
# FiatCategory


## Properties

Name | Type
------------ | -------------
`type` | [CategoryType](CategoryType.md)
`title` | string
`assets` | [Array&lt;AssetType&gt;](AssetType.md)
`subtitle` | string
`badge` | string
`items` | [Array&lt;FiatCategoryItemsInner&gt;](FiatCategoryItemsInner.md)

## Example

```typescript
import type { FiatCategory } from ''

// TODO: Update the object below with actual values
const example = {
  "type": null,
  "title": Buy TON,
  "assets": null,
  "subtitle": Buy Toncoins and other crypto with credit card,
  "badge": null,
  "items": null,
} satisfies FiatCategory

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FiatCategory
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


