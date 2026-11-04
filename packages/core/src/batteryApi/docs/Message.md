# Message

## Properties

| Name            | Type                                           |
| --------------- | ---------------------------------------------- |
| `msgType`       | string                                         |
| `createdLt`     | number                                         |
| `ihrDisabled`   | boolean                                        |
| `bounce`        | boolean                                        |
| `bounced`       | boolean                                        |
| `value`         | number                                         |
| `valueExtra`    | [Array&lt;ExtraCurrency&gt;](ExtraCurrency.md) |
| `fwdFee`        | number                                         |
| `ihrFee`        | number                                         |
| `destination`   | [AccountAddress](AccountAddress.md)            |
| `source`        | [AccountAddress](AccountAddress.md)            |
| `importFee`     | number                                         |
| `createdAt`     | number                                         |
| `opCode`        | string                                         |
| `init`          | [StateInit](StateInit.md)                      |
| `hash`          | string                                         |
| `rawBody`       | string                                         |
| `decodedOpName` | string                                         |
| `decodedBody`   | any                                            |

## Example

```typescript
import type { Message } from ''

// TODO: Update the object below with actual values
const example = {
  "msgType": int_msg,
  "createdLt": 25713146000001,
  "ihrDisabled": true,
  "bounce": true,
  "bounced": true,
  "value": 60000000,
  "valueExtra": null,
  "fwdFee": 5681002,
  "ihrFee": 5681002,
  "destination": null,
  "source": null,
  "importFee": 5681002,
  "createdAt": 5681002,
  "opCode": 0xdeadbeaf,
  "init": null,
  "hash": 1219de582369ac80ee1afe12147930f458a54ff1eea612611a8bc6bd31581a6c,
  "rawBody": B5EE9C7201010101001100001D00048656C6C6F2C20776F726C64218,
  "decodedOpName": nft_transfer,
  "decodedBody": null,
} satisfies Message

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Message
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
