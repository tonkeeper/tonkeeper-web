# Action

## Properties

| Name                        | Type                                                                  |
| --------------------------- | --------------------------------------------------------------------- |
| `type`                      | string                                                                |
| `status`                    | string                                                                |
| `tonTransfer`               | [TonTransferAction](TonTransferAction.md)                             |
| `extraCurrencyTransfer`     | [ExtraCurrencyTransferAction](ExtraCurrencyTransferAction.md)         |
| `contractDeploy`            | [ContractDeployAction](ContractDeployAction.md)                       |
| `jettonTransfer`            | [JettonTransferAction](JettonTransferAction.md)                       |
| `flawedJettonTransfer`      | [FlawedJettonTransferAction](FlawedJettonTransferAction.md)           |
| `jettonBurn`                | [JettonBurnAction](JettonBurnAction.md)                               |
| `jettonMint`                | [JettonMintAction](JettonMintAction.md)                               |
| `nftItemTransfer`           | [NftItemTransferAction](NftItemTransferAction.md)                     |
| `subscribe`                 | [SubscriptionAction](SubscriptionAction.md)                           |
| `unSubscribe`               | [UnSubscriptionAction](UnSubscriptionAction.md)                       |
| `auctionBid`                | [AuctionBidAction](AuctionBidAction.md)                               |
| `nftPurchase`               | [NftPurchaseAction](NftPurchaseAction.md)                             |
| `depositStake`              | [DepositStakeAction](DepositStakeAction.md)                           |
| `withdrawStake`             | [WithdrawStakeAction](WithdrawStakeAction.md)                         |
| `withdrawStakeRequest`      | [WithdrawStakeRequestAction](WithdrawStakeRequestAction.md)           |
| `electionsDepositStake`     | [ElectionsDepositStakeAction](ElectionsDepositStakeAction.md)         |
| `electionsRecoverStake`     | [ElectionsRecoverStakeAction](ElectionsRecoverStakeAction.md)         |
| `jettonSwap`                | [JettonSwapAction](JettonSwapAction.md)                               |
| `smartContractExec`         | [SmartContractAction](SmartContractAction.md)                         |
| `domainRenew`               | [DomainRenewAction](DomainRenewAction.md)                             |
| `purchase`                  | [PurchaseAction](PurchaseAction.md)                                   |
| `addExtension`              | [AddExtensionAction](AddExtensionAction.md)                           |
| `removeExtension`           | [RemoveExtensionAction](RemoveExtensionAction.md)                     |
| `setSignatureAllowedAction` | [SetSignatureAllowedAction](SetSignatureAllowedAction.md)             |
| `gasRelay`                  | [GasRelayAction](GasRelayAction.md)                                   |
| `depositTokenStake`         | [DepositTokenStakeAction](DepositTokenStakeAction.md)                 |
| `withdrawTokenStakeRequest` | [WithdrawTokenStakeRequestAction](WithdrawTokenStakeRequestAction.md) |
| `liquidityDeposit`          | [LiquidityDepositAction](LiquidityDepositAction.md)                   |
| `oracleRequest`             | [OracleRequestAction](OracleRequestAction.md)                         |
| `withdrawXTR`               | [WithdrawXTRAction](WithdrawXTRAction.md)                             |
| `depositXTR`                | [DepositXTRAction](DepositXTRAction.md)                               |
| `buyXTR`                    | [BuyXTRAction](BuyXTRAction.md)                                       |
| `simplePreview`             | [ActionSimplePreview](ActionSimplePreview.md)                         |
| `baseTransactions`          | Array&lt;string&gt;                                                   |

## Example

```typescript
import type { Action } from '';

// TODO: Update the object below with actual values
const example = {
    type: TonTransfer,
    status: ok,
    tonTransfer: null,
    extraCurrencyTransfer: null,
    contractDeploy: null,
    jettonTransfer: null,
    flawedJettonTransfer: null,
    jettonBurn: null,
    jettonMint: null,
    nftItemTransfer: null,
    subscribe: null,
    unSubscribe: null,
    auctionBid: null,
    nftPurchase: null,
    depositStake: null,
    withdrawStake: null,
    withdrawStakeRequest: null,
    electionsDepositStake: null,
    electionsRecoverStake: null,
    jettonSwap: null,
    smartContractExec: null,
    domainRenew: null,
    purchase: null,
    addExtension: null,
    removeExtension: null,
    setSignatureAllowedAction: null,
    gasRelay: null,
    depositTokenStake: null,
    withdrawTokenStakeRequest: null,
    liquidityDeposit: null,
    oracleRequest: null,
    withdrawXTR: null,
    depositXTR: null,
    buyXTR: null,
    simplePreview: null,
    baseTransactions: null
} satisfies Action;

console.log(example);

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example);
console.log(exampleJSON);

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as Action;
console.log(exampleParsed);
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints)
[[Back to Model list]](../README.md#models) [[Back to README]](../README.md)
