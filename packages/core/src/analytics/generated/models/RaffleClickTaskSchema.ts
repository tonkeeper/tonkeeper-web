/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Fired when the user taps a row in the "How to earn tickets" list on the active raffle modal.
 *
 */
export type RaffleClickTaskSchema = {
    eventName: string;
    /**
     * Backend-defined identifier of the tapped task. Open vocabulary; values seen in production include migrate_assets, cross_chain_swap_volume.
     *
     */
    task_id: string;
};

