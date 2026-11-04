/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RaffleKindSchema } from './RaffleKindSchema';
/**
 * Fired when the user taps "Get More" on the ticket card of the raffle modal.
 *
 */
export type RaffleClickGetMoreSchema = {
    eventName: string;
    kind: RaffleKindSchema;
    /**
     * The user's total ticket count at the time of the tap.
     */
    tickets_total: number;
};

