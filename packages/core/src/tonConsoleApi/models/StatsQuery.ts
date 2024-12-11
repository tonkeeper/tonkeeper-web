/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type StatsQuery = {
    name?: string;
    addresses?: Array<string>;
    only_between?: boolean;
    sql?: string;
    gpt_message?: string;
    /**
     * cyclic execution of requests
     */
    repeat_interval?: number;
};

