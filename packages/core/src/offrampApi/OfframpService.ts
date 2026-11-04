import { OfframpApi } from '../swapsApiGenerated';
import type {
    CreateOfframpOrderOperationRequest,
    GetOfframpAssetRequest,
    OfframpAssetDetail,
    OfframpOrder,
    OfframpQuoteOperationRequest,
    OfframpQuotes
} from '../swapsApiGenerated';
import { v4 as uuidv4 } from 'uuid';
import { swapsApiConfiguration } from '../swapsApi/client';

const offrampApi = (baseUrl: string) => new OfframpApi(swapsApiConfiguration(baseUrl));

export const fetchOfframpAsset = (
    baseUrl: string,
    params: GetOfframpAssetRequest
): Promise<OfframpAssetDetail> => offrampApi(baseUrl).getOfframpAsset(params);

export const fetchOfframpQuote = (
    baseUrl: string,
    params: OfframpQuoteOperationRequest
): Promise<OfframpQuotes> => offrampApi(baseUrl).offrampQuote(params);

/**
 * Callers retrying one user action pass the same `idempotencyKey` so the
 * backend creates a single order; a fresh key is minted otherwise.
 */
export const createOfframpOrder = (
    baseUrl: string,
    params: CreateOfframpOrderOperationRequest
): Promise<OfframpOrder> =>
    offrampApi(baseUrl).createOfframpOrder({
        ...params,
        idempotencyKey: params.idempotencyKey ?? uuidv4()
    });
