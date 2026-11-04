import { ExchangeApi, OnrampApi, P2pApi, ResponseError } from '../swapsApiGenerated';
import type {
    CreateOnrampOrderOperationRequest,
    CreateP2PSessionRequest,
    ExchangeLayoutCards,
    ExchangeMerchantInfo,
    GetExchangeLayoutCardsRequest,
    GetExchangeMerchantsRequest,
    GetOnrampAssetRequest,
    GetOnrampChainsRequest,
    GetOnrampConfigurationRequest,
    GetOnrampOrderRequest,
    OnrampAssetDetail,
    OnrampChains,
    OnrampConfiguration,
    OnrampOrder,
    OnrampQuoteOperationRequest,
    OnrampQuoteResult,
    OnrampQuotes,
    P2PSessionResult
} from '../swapsApiGenerated';
import { v4 as uuidv4 } from 'uuid';
import { swapsApiConfiguration } from '../swapsApi/client';

const onrampApi = (baseUrl: string) => new OnrampApi(swapsApiConfiguration(baseUrl));
const exchangeApi = (baseUrl: string) => new ExchangeApi(swapsApiConfiguration(baseUrl));

/**
 * Fields an on-ramp and an off-ramp quote share. Provider cards and the
 * provider picker render from this shape so both flows can drive them.
 */
export type RampQuote = Omit<OnrampQuoteResult, 'paymentMethod'>;

export const fetchOnrampConfiguration = (
    baseUrl: string,
    params: GetOnrampConfigurationRequest = {}
): Promise<OnrampConfiguration> => onrampApi(baseUrl).getOnrampConfiguration(params);

export const fetchOnrampChains = (
    baseUrl: string,
    params: GetOnrampChainsRequest = {}
): Promise<OnrampChains> => onrampApi(baseUrl).getOnrampChains(params);

export const fetchOnrampAsset = (
    baseUrl: string,
    params: GetOnrampAssetRequest
): Promise<OnrampAssetDetail> => onrampApi(baseUrl).getOnrampAsset(params);

export const fetchExchangeLayout = (
    baseUrl: string,
    params: GetExchangeLayoutCardsRequest
): Promise<ExchangeLayoutCards> => exchangeApi(baseUrl).getExchangeLayoutCards(params);

/**
 * Layout with the user's fiat winning over the geo-derived one. The
 * backend derives `preferred_currency` from geo signals (country,
 * timezone) unless `currency` is sent, so the app fiat is requested
 * first. Two responses mean the backend can't serve that fiat — a 4xx
 * (rejected code) or an empty card list — and both fall back to the geo
 * request so the buy entry point is never lost. Anything else (5xx,
 * network) propagates: treating it as a rejection would silently pin the
 * geo fiat in caches keyed by the requested currency.
 */
export const fetchExchangeLayoutPreferringFiat = async (
    baseUrl: string,
    params: Omit<GetExchangeLayoutCardsRequest, 'currency'>,
    fiat?: string
): Promise<ExchangeLayoutCards> => {
    if (fiat) {
        let layout: ExchangeLayoutCards | undefined;
        try {
            layout = await fetchExchangeLayout(baseUrl, { ...params, currency: fiat });
        } catch (e) {
            if (!(e instanceof ResponseError) || e.response.status >= 500) {
                throw e;
            }
        }
        if (layout && layout.items.length > 0) {
            return layout;
        }
    }
    return fetchExchangeLayout(baseUrl, params);
};

export const fetchOnrampQuote = (
    baseUrl: string,
    params: OnrampQuoteOperationRequest
): Promise<OnrampQuotes> => onrampApi(baseUrl).onrampQuote(params);

/**
 * Callers retrying one user action pass the same `idempotencyKey` so the
 * backend creates a single order; a fresh key is minted otherwise.
 */
export const createOnrampOrder = (
    baseUrl: string,
    params: CreateOnrampOrderOperationRequest
): Promise<OnrampOrder> =>
    onrampApi(baseUrl).createOnrampOrder({
        ...params,
        idempotencyKey: params.idempotencyKey ?? uuidv4()
    });

export const fetchOnrampOrder = (
    baseUrl: string,
    params: GetOnrampOrderRequest
): Promise<OnrampOrder> => onrampApi(baseUrl).getOnrampOrder(params);

export const fetchExchangeMerchants = (
    baseUrl: string,
    params: GetExchangeMerchantsRequest = {}
): Promise<ExchangeMerchantInfo[]> => exchangeApi(baseUrl).getExchangeMerchants(params);

export const createP2PSession = (
    baseUrl: string,
    body: CreateP2PSessionRequest
): Promise<P2PSessionResult> =>
    new P2pApi(swapsApiConfiguration(baseUrl)).createP2PSession({
        createP2PSessionRequest: body
    });
