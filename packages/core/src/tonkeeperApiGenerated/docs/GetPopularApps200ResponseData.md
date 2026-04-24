
# GetPopularApps200ResponseData


## Properties

Name | Type
------------ | -------------
`moreEnabled` | boolean
`categories` | [Array&lt;PopularCategory&gt;](PopularCategory.md)
`apps` | [Array&lt;PopularApp&gt;](PopularApp.md)

## Example

```typescript
import type { GetPopularApps200ResponseData } from ''

// TODO: Update the object below with actual values
const example = {
  "moreEnabled": null,
  "categories": null,
  "apps": null,
} satisfies GetPopularApps200ResponseData

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GetPopularApps200ResponseData
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


