/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetChainSchema } from './AssetChainSchema';
import type { LocationSchema } from './LocationSchema';
import type { UrlSchema } from './UrlSchema';
/**
 * A dapp is pinned in the Browser/Discover section.
 * Emitted only by `pro-mobile`. The native clients ship no pin UI at all, so they emit neither dapp_pin nor dapp_unpin — their absence there is a missing feature, not a drop in pinning, and must not be read as one. Instrument the properties below if a pin UI ever ships on a native client, and drop this note then.
 *
 */
export type DappPinSchema = {
    eventName: string;
    url: UrlSchema;
    asset_chain: AssetChainSchema;
    location: LocationSchema;
};

