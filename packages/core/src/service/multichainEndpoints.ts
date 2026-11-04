import type { TonendpointConfig } from '../tonkeeperApi/tonendpoint';
import { removeLastSlash } from '../utils/url';

/**
 * Origins of the multichain and trading backends. The boot config carries
 * them under `multichain.domain` / `trading.domain` so the backend can
 * route a region to a different host (the same contract iOS reads); the
 * compiled defaults stand until the config answers and whenever it omits
 * a block. Route paths (`/api/v1/...`) stay in the services.
 */
const DEFAULT_MULTICHAIN_API_ORIGIN = 'https://multi.tonkeeper.com';
const DEFAULT_TRADING_API_ORIGIN = 'https://trading.tonkeeper.com';

let multichainOrigin = DEFAULT_MULTICHAIN_API_ORIGIN;
let tradingOrigin = DEFAULT_TRADING_API_ORIGIN;

const toHttpBase = (domain: string | undefined, fallback: string): string => {
    if (typeof domain !== 'string' || domain.trim() === '') return fallback;
    try {
        const url = new URL(domain);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return fallback;
        return removeLastSlash(url.toString());
    } catch {
        return fallback;
    }
};

export const applyMultichainEndpoints = (
    config: Pick<TonendpointConfig, 'multichain' | 'trading'>
): void => {
    multichainOrigin = toHttpBase(config.multichain?.domain, DEFAULT_MULTICHAIN_API_ORIGIN);
    tradingOrigin = toHttpBase(config.trading?.domain, DEFAULT_TRADING_API_ORIGIN);
};

export const multichainApiOrigin = (): string => multichainOrigin;

export const multichainApiBaseUrl = (): string => `${multichainOrigin}/api/v1`;

export const tradingApiOrigin = (): string => tradingOrigin;

/** Test-only: restore the compiled defaults so tests don't leak a configured host. */
export const _resetMultichainEndpointsForTests = (): void => {
    multichainOrigin = DEFAULT_MULTICHAIN_API_ORIGIN;
    tradingOrigin = DEFAULT_TRADING_API_ORIGIN;
};
