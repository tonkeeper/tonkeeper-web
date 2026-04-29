
# WidgetRate


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`rate` | number
`currency` | string
`logo` | string
`minTonBuyAmount` | number
`minTonSellAmount` | number

## Example

```typescript
import type { WidgetRate } from ''

// TODO: Update the object below with actual values
const example = {
  "id": moonpay,
  "name": null,
  "rate": 100.2,
  "currency": USD,
  "logo": null,
  "minTonBuyAmount": 1000000000,
  "minTonSellAmount": 100000000,
} satisfies WidgetRate

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as WidgetRate
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


