/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TokenCapability } from './TokenCapability';
export type ProjectTonApiToken = {
    id: number;
    name: string;
    limit_rps?: number;
    token: string;
    origins: Array<string>;
    date_create: number;
    capabilities?: Array<TokenCapability>;
};

