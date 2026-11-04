# StateInit

## Properties

| Name         | Type                |
| ------------ | ------------------- |
| `boc`        | string              |
| `interfaces` | Array&lt;string&gt; |

## Example

```typescript
import type { StateInit } from '';

// TODO: Update the object below with actual values
const example = {
    boc: b5ee9c72010106010044000114ff00f4a413f4bcf2c80b01020120020302014804050004f2300038d06c21d31f30ed44d0d33f3001c00197a4c8cb3fc9ed549330f206e20011a13431da89a1a67e61,
    interfaces: null
} satisfies StateInit;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as StateInit;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
