/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * How the Earn page was closed:
 *
 * - page: the page closed itself through
 * `window.native.invoke('ui.close')` — the back arrow on the main page
 * of the catalog
 * - close_button: the close button of the wallet's own header, shown
 * over the page when the page has not drawn its header in time
 * - system_back: the system back button or gesture. The iOS clients
 * turn the back swipe off while Earn is open, so they never send this
 * value.
 * - other: the wallet closed the page to continue in another flow
 *
 */
export type EarnExitMethodSchema = 'page' | 'close_button' | 'system_back' | 'other';
