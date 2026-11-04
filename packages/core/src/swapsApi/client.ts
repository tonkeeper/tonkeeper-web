import { Configuration, Middleware } from '../swapsApiGenerated';
import { removeLastSlash } from '../utils/url';

const mapJsonKeys = (value: unknown, mapKey: (key: string) => string): unknown => {
    if (Array.isArray(value)) {
        return value.map(item => mapJsonKeys(item, mapKey));
    }

    if (value !== null && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [mapKey(key), mapJsonKeys(item, mapKey)])
        );
    }

    return value;
};

const camelToSnake = (key: string): string =>
    key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

const snakeToCamel = (key: string): string =>
    key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());

export const encodeCrossSwapJson = (value: unknown): unknown => mapJsonKeys(value, camelToSnake);

export const decodeCrossSwapJson = (value: unknown): unknown => mapJsonKeys(value, snakeToCamel);

/**
 * Pre-middleware that merges the shared Tonkeeper identification params
 * (`lang`, `build`, `chainName`, `platform`) into every swaps request, mirroring
 * what the boot/api backends already receive.
 */
export const extraQueryMiddleware = (extraQuery: Record<string, string>): Middleware => ({
    pre: async ({ url, init }) => {
        const parsed = new URL(url);
        for (const [key, value] of Object.entries(extraQuery)) {
            if (!parsed.searchParams.has(key)) {
                parsed.searchParams.set(key, value);
            }
        }
        return { url: parsed.toString(), init };
    }
});

/**
 * The swaps backend uses snake_case JSON while its generated TypeScript
 * models use camelCase. The generated runtime does not install model
 * serializers, so translate once at its HTTP boundary for every endpoint.
 */
const jsonMiddleware: Middleware = {
    pre: async ({ url, init }) => {
        const contentType = new Headers(init.headers).get('Content-Type');
        if (typeof init.body !== 'string' || !contentType?.includes('application/json')) {
            return { url, init };
        }

        return {
            url,
            init: {
                ...init,
                body: JSON.stringify(encodeCrossSwapJson(JSON.parse(init.body)))
            }
        };
    },
    post: async ({ response }) => {
        if (!response.headers.get('Content-Type')?.includes('application/json')) {
            return response;
        }

        const data = decodeCrossSwapJson(await response.json());
        const headers = new Headers(response.headers);
        headers.delete('Content-Length');
        headers.delete('Content-Encoding');
        return new Response(JSON.stringify(data), {
            status: response.status,
            statusText: response.statusText,
            headers
        });
    }
};

/**
 * The generated client also emits camelCase query names (`assetId`) while the
 * backend reads snake_case. Runs before the shared identification params are
 * merged in, so only the generated operation parameters are translated.
 */
const queryMiddleware: Middleware = {
    pre: async ({ url, init }) => {
        const parsed = new URL(url);
        const entries = Array.from(parsed.searchParams.entries());
        if (!entries.some(([key]) => camelToSnake(key) !== key)) return { url, init };
        parsed.search = '';
        for (const [key, value] of entries) {
            parsed.searchParams.append(camelToSnake(key), value);
        }
        return { url: parsed.toString(), init };
    }
};

/**
 * Configuration for every generated swaps-backend API class (crosschain,
 * onramp, offramp, exchange, p2p): snake_case wire translation plus the
 * shared identification params.
 */
export const swapsApiConfiguration = (
    baseUrl: string,
    query: Record<string, string> = {}
): Configuration =>
    new Configuration({
        basePath: removeLastSlash(baseUrl),
        middleware: [queryMiddleware, extraQueryMiddleware(query), jsonMiddleware]
    });
