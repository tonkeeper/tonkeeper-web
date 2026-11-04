# CreatePromoCampaignRequest

## Properties

| Name           | Type                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `name`         | string                                                                                                     |
| `participants` | [Array&lt;CreatePromoCampaignRequestParticipantsInner&gt;](CreatePromoCampaignRequestParticipantsInner.md) |

## Example

```typescript
import type { CreatePromoCampaignRequest } from '';

// TODO: Update the object below with actual values
const example = {
    name: null,
    participants: null
} satisfies CreatePromoCampaignRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreatePromoCampaignRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
