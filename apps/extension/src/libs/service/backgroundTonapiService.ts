import { TonendpointConfig } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { createSlidingWindowRateLimiter } from '@tonkeeper/core/dist/utils/rateLimiter';
import memoryStore from '../store/memoryStore';
import ExtensionPlatform from './extension';

const getToken = async (url: string) => {
    let token = memoryStore.getTonapiToken();
    if (!token) {
        const version = ExtensionPlatform.getVersion();
        const chainName = url.includes('testnet') ? 'testnet' : 'mainnet';

        const boot = `https://boot.tonkeeper.com/keys?build=${version}&chainName=${chainName}`;
        const result = await fetch(`https://c.tonapi.io/json?url=${btoa(boot)}`);
        const config: TonendpointConfig = await result.json();

        token = config.tonApiV2Key;

        if (!token) {
            throw new Error('Missing token');
        }
        memoryStore.setTonapiToken(token);
    }
    return token;
};

/**
 * Page-controlled headers that must never be forwarded upstream:
 * - Cookie would attach the user's tonapi.io session to a proxied request.
 * - X-Forwarded-* / Forwarded / X-Real-IP would let the page spoof the
 *   originating IP seen by tonapi.io.
 * - X-Authorization is set by us (from the dApp `Authorization` header); a page
 *   must not be able to inject it directly.
 */
const UNSAFE_FORWARD_HEADERS = [
    'Cookie',
    'X-Forwarded-For',
    'X-Forwarded-Host',
    'X-Forwarded-Proto',
    'Forwarded',
    'X-Real-IP',
    'X-Authorization'
];

const tonapiRateLimiter = createSlidingWindowRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60
});

export const createTonapiRequest = async (
    origin: string,
    url: string,
    options: RequestInit = {}
) => {
    if (!isTonapiUrl(url)) {
        throw new Error('Unsupported endpoint');
    }

    if (!tonapiRateLimiter.tryConsume(origin)) {
        throw new Error('Too many requests');
    }

    const token = await getToken(url);
    const reqHeaders = new Headers(options.headers);

    UNSAFE_FORWARD_HEADERS.forEach(header => reqHeaders.delete(header));

    const userToken = reqHeaders.get('Authorization');
    if (userToken) {
        reqHeaders.append('X-Authorization', userToken);
        reqHeaders.delete('Authorization');
    }
    reqHeaders.append('Authorization', `Bearer ${token}`);
    options.headers = reqHeaders;

    const response = await fetch(url, options);
    return {
        payload: await response.json(),
        status: response.status,
        statusText: response.statusText,
        headers: Array.from(response.headers)
    };
};

function isTonapiUrl(url: string) {
    try {
        const parsed = new URL(url);
        const allowedHosts = ['tonapi.io', 'testnet.tonapi.io'];
        return parsed.protocol === 'https:' && allowedHosts.includes(parsed.hostname);
    } catch (e) {
        return false;
    }
}
