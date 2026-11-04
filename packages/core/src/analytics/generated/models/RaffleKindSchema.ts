/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Which variant of the raffle modal was shown:
 * - active - the live raffle: ticket count, "how to earn tickets" tasks,
 * milestone bonuses
 * - migration - the week-1 variant shown before the full ticket-earning
 * flow is live, focused on migrating to unlock the raffle
 * - won - results screen, user won a prize (see prize) - lost - results screen, user did not win
 *
 */
export type RaffleKindSchema = 'active' | 'migration' | 'won' | 'lost';
