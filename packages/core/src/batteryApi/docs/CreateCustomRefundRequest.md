# CreateCustomRefundRequest

## Properties

| Name             | Type   |
| ---------------- | ------ |
| `relayerEventId` | number |
| `amount`         | string |
| `currency`       | string |
| `comment`        | string |
| `reason`         | string |
| `destination`    | string |

## Example

```typescript
import type { CreateCustomRefundRequest } from '';

// TODO: Update the object below with actual values
const example = {
    relayerEventId: null,
    amount: 10.25,
    currency: null,
    comment: null,
    reason: null,
    destination: null
} satisfies CreateCustomRefundRequest;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as CreateCustomRefundRequest;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
