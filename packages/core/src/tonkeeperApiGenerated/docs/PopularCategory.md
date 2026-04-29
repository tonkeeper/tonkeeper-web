
# PopularCategory


## Properties

Name | Type
------------ | -------------
`id` | string
`title` | string
`apps` | [Array&lt;PopularApp&gt;](PopularApp.md)

## Example

```typescript
import type { PopularCategory } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "title": Test,
  "apps": null,
} satisfies PopularCategory

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as PopularCategory
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


