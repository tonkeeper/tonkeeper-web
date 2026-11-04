/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Fired when the user taps a row in the "Milestone bonuses" list on the active raffle modal.
 *
 */
export type RaffleClickMilestoneSchema = {
    eventName: string;
    /**
     * Backend-defined identifier of the tapped milestone. Open vocabulary; values seen in production include keeper, trusted, senior, legend.
     *
     */
    milestone_id: string;
};

