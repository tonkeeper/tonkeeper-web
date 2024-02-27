/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatsEstimateQuery } from './StatsEstimateQuery';
import type { StatsQuery } from './StatsQuery';
import type { StatsQueryStatus } from './StatsQueryStatus';
import type { StatsQueryType } from './StatsQueryType';
export type StatsQueryResult = {
    id: string;
    status: StatsQueryStatus;
    query?: StatsQuery;
    type?: StatsQueryType;
    estimate?: StatsEstimateQuery;
    url?: string;
    meta_url?: string;
    spent_time?: number;
    last_repeat_date?: number;
    total_repetitions?: number;
    total_cost?: number;
    cost?: number;
    error?: string;
    all_data_in_preview?: boolean;
    preview?: Array<Array<string>>;
    testnet: boolean;
    is_gpt?: boolean;
    date_create: number;
};

