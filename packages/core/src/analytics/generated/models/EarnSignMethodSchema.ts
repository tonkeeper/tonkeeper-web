/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * What the Earn page asked the wallet to sign, named after the JSON-RPC
 * method of the injected provider:
 *
 * - send_transaction: `eth_sendTransaction` — sign a transaction and
 * broadcast it. Every step of a multi-step operation (approve →
 * deposit, the request and the claim of a delayed withdrawal) is a
 * request of its own.
 * - personal_sign: `personal_sign` — sign a message
 * - sign_typed_data: `eth_signTypedData_v4` — sign typed data, such as a
 * permit
 *
 */
export type EarnSignMethodSchema = 'send_transaction' | 'personal_sign' | 'sign_typed_data';
