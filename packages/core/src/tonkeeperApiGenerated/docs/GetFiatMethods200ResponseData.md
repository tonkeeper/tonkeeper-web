
# GetFiatMethods200ResponseData


## Properties

Name | Type
------------ | -------------
`layoutByCountry` | [Array&lt;GetFiatMethods200ResponseDataLayoutByCountryInner&gt;](GetFiatMethods200ResponseDataLayoutByCountryInner.md)
`defaultLayout` | [GetFiatMethods200ResponseDataDefaultLayout](GetFiatMethods200ResponseDataDefaultLayout.md)
`categories` | [Array&lt;FiatCategory&gt;](FiatCategory.md)
`buy` | [Array&lt;FiatCategory&gt;](FiatCategory.md)
`sell` | [Array&lt;FiatCategory&gt;](FiatCategory.md)

## Example

```typescript
import type { GetFiatMethods200ResponseData } from ''

// TODO: Update the object below with actual values
const example = {
  "layoutByCountry": null,
  "defaultLayout": null,
  "categories": null,
  "buy": null,
  "sell": null,
} satisfies GetFiatMethods200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetFiatMethods200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


