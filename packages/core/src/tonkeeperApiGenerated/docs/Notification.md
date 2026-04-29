
# Notification


## Properties

Name | Type
------------ | -------------
`id` | string
`title` | string
`caption` | string
`mode` | string
`action` | [NotificationAction](NotificationAction.md)
`isPersistenceHide` | boolean

## Example

```typescript
import type { Notification } from ''

// TODO: Update the object below with actual values
const example = {
  "id": update-4.1.2,
  "title": Update Tonkeeper,
  "caption": A new version of Tonkeeper is available,
  "mode": warning,
  "action": null,
  "isPersistenceHide": null,
} satisfies Notification

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Notification
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


