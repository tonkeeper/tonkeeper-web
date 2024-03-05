/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type StatsQuery = {
    addresses?: Array<string>;
    only_between?: boolean;
    sql?: string;
    gpt_message?: string;
    /**
     * cyclic execution of requests
     */
    repeat_interval?: number;
};

