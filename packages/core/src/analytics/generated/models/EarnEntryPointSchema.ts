/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * An Earn entry point of the wallet. The values are the Earn values of
 * DappAppFrom, so a view here and the tap on dapp_app_click /
 * dapp_app_loaded match on value: CTR of an entry point is
 * dapp_app_click(from = X) / earn_entry_view(from = X).
 *
 * - earn_featured: the "Earn" carousel of featured vaults on the wallet
 * main screen, shown while the wallet holds no Earn positions
 * - earn_your_vaults: the "Earn" block on the wallet main screen that
 * lists the vaults the wallet holds
 * - earn_apy: the "Earn up to …% APY" badge on an asset page, shown when
 * a vault is offered for the asset. The TON badge that opens staking
 * is not an Earn entry point and never carries this value.
 *
 */
export type EarnEntryPointSchema = 'earn_featured' | 'earn_your_vaults' | 'earn_apy';
