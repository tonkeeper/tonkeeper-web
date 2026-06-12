import { Configuration, Middleware, SwapApi } from '../swapsApiGenerated';
import type { OmnistonSwapMessages, SwapAsset } from '../swapsApiGenerated';
import { removeLastSlash } from '../utils/url';

/**
 * Pre-middleware that merges the shared Tonkeeper identification params
 * (`lang`, `build`, `chainName`, `platform`) into every swaps request, mirroring
 * what the boot/api backends already receive.
 */
const extraQueryMiddleware = (extraQuery: Record<string, string>): Middleware => ({
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

export async function fetchSwapAssets(
    baseUrl: string,
    params: { q?: string; limit?: number } = {},
    query: Record<string, string> = {}
): Promise<SwapAsset[]> {
    return new SwapApi(
        new Configuration({
            basePath: removeLastSlash(baseUrl),
            middleware: [extraQueryMiddleware(query)]
        })
    ).swapAssets(params);
}

const QUOTE_TIMEOUT_MS = 10_000;

export function subscribeToOmnistonStream(params: {
    baseUrl: string;
    fromAsset: string;
    toAsset: string;
    fromAmount: string;
    userAddress: string;
    slippageBps?: number;
    query?: Record<string, string>;
    onQuote: (confirmation: OmnistonSwapMessages) => void;
    onError: (error: Error) => void;
    signal?: AbortSignal;
}): { close: () => void } {
    const url = new URL('/v2/swap/omniston/stream', params.baseUrl);
    url.searchParams.set('fromAsset', params.fromAsset);
    url.searchParams.set('toAsset', params.toAsset);
    url.searchParams.set('fromAmount', params.fromAmount);
    url.searchParams.set('userAddress', params.userAddress);
    if (params.slippageBps !== undefined) {
        url.searchParams.set('slippage', String(params.slippageBps));
    }
    for (const [key, value] of Object.entries(params.query ?? {})) {
        if (!url.searchParams.has(key)) {
            url.searchParams.set(key, value);
        }
    }

    const eventSource = new EventSource(url.toString());
    let quoteTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const onMessage = (event: MessageEvent<string>) => {
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'connected') {
                quoteTimeoutId = setTimeout(() => {
                    close();
                    params.onError(new Error('Quote request timed out'));
                }, QUOTE_TIMEOUT_MS);
                return;
            }

            clearTimeout(quoteTimeoutId);

            if (data.error) {
                close();
                params.onError(new Error(data.error));
                return;
            }

            params.onQuote(data as OmnistonSwapMessages);
        } catch (e) {
            clearTimeout(quoteTimeoutId);
            close();
            params.onError(e instanceof Error ? e : new Error('Failed to parse SSE message'));
        }
    };

    const onError = () => {
        close();
        params.onError(new Error('SSE connection closed'));
    };

    eventSource.addEventListener('message', onMessage);
    eventSource.addEventListener('error', onError);

    const close = () => {
        clearTimeout(quoteTimeoutId);
        eventSource.removeEventListener('message', onMessage);
        eventSource.removeEventListener('error', onError);
        eventSource.close();
    };

    if (params.signal) {
        if (params.signal.aborted) {
            close();
        } else {
            params.signal.addEventListener('abort', close, { once: true });
        }
    }

    return { close };
}
