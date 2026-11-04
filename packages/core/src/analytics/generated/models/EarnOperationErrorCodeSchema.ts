/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Why a deposit, withdrawal or claim did not complete, as the page's own
 * code. The values below keep their meaning; the page may send codes of
 * its own for other failures.
 *
 * - rejected: the user declined the request in the wallet — the page got
 * 4001 from window.ethereum
 * - wallet_error: the wallet answered the request with another error
 * - prepare_failed: the page could not prepare the transaction
 * - reverted: the transaction was sent and reverted on chain
 *
 */
export type EarnOperationErrorCodeSchema = string;
