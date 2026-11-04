# CreatePromoCampaignByUserRequest

## Properties

| Name           | Type                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `name`         | string                                                                                                                 |
| `participants` | [Array&lt;CreatePromoCampaignByUserRequestParticipantsInner&gt;](CreatePromoCampaignByUserRequestParticipantsInner.md) |

## Example

```typescript
import type { CreatePromoCampaignByUserRequest } from '';

// TODO: Update the object below with actual values
const example = {
    name: null,
    participants: null
} satisfies CreatePromoCampaignByUserRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreatePromoCampaignByUserRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
