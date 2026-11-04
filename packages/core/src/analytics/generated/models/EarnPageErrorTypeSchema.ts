/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * What went wrong inside the page, as the page names it. The values below
 * keep their meaning; the page may send values of its own for other
 * failures.
 *
 * - network: a request of the page did not reach its server
 * - api: the page's server answered with an error
 * - js_exception: an unhandled JavaScript exception
 * - wallet_unavailable: the page has no wallet it can work with —
 * window.ethereum is missing, or it rejects the request for the
 * accounts (eth_requestAccounts, eth_accounts) with code 4100. The page
 * sends it once per page load. It never comes from a page opened
 * outside the app or on another host: the clients inject
 * window.ethereum and window.native, the bridge the page reports
 * through, into the Earn host only.
 *
 */
export type EarnPageErrorTypeSchema = string;
