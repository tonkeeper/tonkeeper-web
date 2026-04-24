
# FiatCategoryItemsInner


## Properties

Name | Type
------------ | -------------
`id` | string
`title` | string
`disabled` | boolean
`badge` | string
`subtitle` | string
`description` | string
`iconUrl` | string
`features` | Array&lt;string&gt;
`assets` | [Array&lt;AssetType&gt;](AssetType.md)
`actionButton` | [FiatCategoryItemsInnerActionButton](FiatCategoryItemsInnerActionButton.md)
`successUrlPattern` | [FiatCategoryItemsInnerSuccessUrlPattern](FiatCategoryItemsInnerSuccessUrlPattern.md)
`infoButtons` | [Array&lt;FiatCategoryItemsInnerInfoButtonsInner&gt;](FiatCategoryItemsInnerInfoButtonsInner.md)

## Example

```typescript
import type { FiatCategoryItemsInner } from ''

// TODO: Update the object below with actual values
const example = {
  "id": neocrypto,
  "title": Neocrypto,
  "disabled": null,
  "badge": null,
  "subtitle": Instantly buy with a credit card,
  "description": Instantly buy with a credit card.,
  "iconUrl": https://tonkeeper.com/assets/neocrypto-new.png,
  "features": null,
  "assets": null,
  "actionButton": null,
  "successUrlPattern": null,
  "infoButtons": null,
} satisfies FiatCategoryItemsInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FiatCategoryItemsInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


