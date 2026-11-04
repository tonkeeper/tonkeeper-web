/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
import type { LocationSchema } from './LocationSchema';
import type { UrlSchema } from './UrlSchema';
export type DappSharingCopySchema = {
    eventName: string;
    url: UrlSchema;
    asset_chain: AssetChainSchema;
    /**
     * Source of the sharing action
     */
    from: 'share' | 'copy_link';
    location: LocationSchema;
};

