/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { StatsQueryType } from './StatsQueryType';

export type Charge = {
    id: string;
    tier_id?: number;
    messages_package_id?: number;
    testnet_price_multiplicator?: number;
    stats_spent_time?: number;
    stats_price_per_second?: number;
    stats_type_query?: StatsQueryType;
    amount: number;
    exchange_rate: number;
    date_create: number;
};

