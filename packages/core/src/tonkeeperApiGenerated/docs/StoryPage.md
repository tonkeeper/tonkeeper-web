
# StoryPage


## Properties

Name | Type
------------ | -------------
`title` | string
`description` | string
`image` | string
`includeWallets` | Array&lt;string&gt;
`button` | [Button](Button.md)
`buttons` | [Array&lt;Button&gt;](Button.md)

## Example

```typescript
import type { StoryPage } from ''

// TODO: Update the object below with actual values
const example = {
  "title": Hello world!,
  "description": Lorem ipsum dolor sit amet, consectetur adipiscing elit.,
  "image": null,
  "includeWallets": null,
  "button": null,
  "buttons": null,
} satisfies StoryPage

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as StoryPage
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


