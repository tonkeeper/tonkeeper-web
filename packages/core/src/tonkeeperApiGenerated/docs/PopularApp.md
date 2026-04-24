
# PopularApp


## Properties

Name | Type
------------ | -------------
`id` | string
`bannerId` | string
`name` | string
`description` | string
`icon` | string
`poster` | string
`url` | string
`excludeCountries` | Array&lt;string&gt;
`includeCountries` | Array&lt;string&gt;
`textColor` | string
`button` | [Button](Button.md)

## Example

```typescript
import type { PopularApp } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "bannerId": null,
  "name": null,
  "description": null,
  "icon": null,
  "poster": null,
  "url": null,
  "excludeCountries": null,
  "includeCountries": null,
  "textColor": #000000,
  "button": null,
} satisfies PopularApp

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PopularApp
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


