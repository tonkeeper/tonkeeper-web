/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RaffleSourceSchema } from './RaffleSourceSchema';
/**
 * Fired when the user closes the Mystery Raffle banner with the "x" button. The banner is only dismissible on wallets_list and trade, so source only ever carries those two values for this event.
 *
 */
export type RaffleBannerDismissSchema = {
    eventName: string;
    source: RaffleSourceSchema;
};

