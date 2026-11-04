/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RaffleKindSchema } from './RaffleKindSchema';
import type { RaffleSourceSchema } from './RaffleSourceSchema';
/**
 * Fired when the raffle modal renders, for every variant (active, migration, won, lost) - there are no separate won/lost events, the outcome is carried by kind and, when won, prize.
 *
 */
export type RaffleOpenSchema = {
    eventName: string;
    source: RaffleSourceSchema;
    kind: RaffleKindSchema;
    /**
     * The user's total ticket count at the time the modal was shown (the final count on won/lost).
     *
     */
    tickets_total: number;
    /**
     * Free-text name of the prize won (e.g. "Plush Pepe NFT", "$10,000 in USDT"). Present only when kind=won.
     *
     */
    prize?: string | null;
};

