
# GetFiatMethods200ResponseDataLayoutByCountryInner


## Properties

Name | Type
------------ | -------------
`countryCode` | [FiatMethodsCountryCode](FiatMethodsCountryCode.md)
`currency` | [FiatMethodsCurrency](FiatMethodsCurrency.md)
`methods` | [Array&lt;Method&gt;](Method.md)

## Example

```typescript
import type { GetFiatMethods200ResponseDataLayoutByCountryInner } from ''

// TODO: Update the object below with actual values
const example = {
  "countryCode": null,
  "currency": null,
  "methods": null,
} satisfies GetFiatMethods200ResponseDataLayoutByCountryInner

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetFiatMethods200ResponseDataLayoutByCountryInner
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


