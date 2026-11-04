/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DappAppFromSchema } from './DappAppFromSchema';
import type { EarnExitMethodSchema } from './EarnExitMethodSchema';
/**
 * Fired when the Earn page is closed and the user is back on the wallet screen that opened it. Not sent when the app is terminated with the page open. `from` is the value the page was opened with on dapp_app_click.
 *
 */
export type EarnCloseSchema = {
    eventName: string;
    from: DappAppFromSchema;
    exit_method: EarnExitMethodSchema;
    /**
     * Milliseconds from opening the page (its dapp_app_click) to closing it.
     *
     */
    duration_ms: number;
};

