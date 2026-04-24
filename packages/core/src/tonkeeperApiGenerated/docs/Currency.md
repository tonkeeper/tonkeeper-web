
# Currency


## Properties

Name | Type
------------ | -------------
`code` | string
`name` | string
`image` | string
`type` | string

## Example

```typescript
import type { Currency } from ''

// TODO: Update the object below with actual values
const example = {
  "code": USD,
  "name": United States Dollar,
  "image": https://tonkeeper.com/assets/currencies/usd.png,
  "type": fiat,
} satisfies Currency

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Currency
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


