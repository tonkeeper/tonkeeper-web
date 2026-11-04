/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RaffleCtaActionSchema } from './RaffleCtaActionSchema';
import type { RaffleKindSchema } from './RaffleKindSchema';
/**
 * Fired when the user taps the bottom CTA button on the raffle modal.
 */
export type RaffleClickCtaSchema = {
    eventName: string;
    action: RaffleCtaActionSchema;
    kind: RaffleKindSchema;
    /**
     * The user's total ticket count at the time of the tap.
     */
    tickets_total: number;
};

