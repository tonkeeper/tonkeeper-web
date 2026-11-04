/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
import type { LocationSchema } from './LocationSchema';
import type { UrlSchema } from './UrlSchema';
/**
 * A previously pinned dapp is unpinned in the Browser/Discover section.
 * Same platform scope as dapp_pin: emitted only by `pro-mobile`, never by the native clients.
 *
 */
export type DappUnpinSchema = {
    eventName: string;
    url: UrlSchema;
    asset_chain: AssetChainSchema;
    location: LocationSchema;
};

