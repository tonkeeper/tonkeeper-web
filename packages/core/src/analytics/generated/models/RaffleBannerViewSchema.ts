/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RaffleSourceSchema } from './RaffleSourceSchema';
/**
 * Fired when the Mystery Raffle promo banner becomes visible on one of its sources. Together with raffle_banner_click this yields per-sources CTR (clicks / views matched on source).
 *
 */
export type RaffleBannerViewSchema = {
    eventName: string;
    source: RaffleSourceSchema;
};

