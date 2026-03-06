import { SwapAsset, SwapConfirmation } from './models';

export async function fetchSwapAssets(baseUrl: string): Promise<SwapAsset[]> {
    const response = await fetch(`${baseUrl}/v2/swap/assets`);
    if (!response.ok) {
        throw new Error(`Failed to fetch swap assets: ${response.status}`);
    }
    return response.json();
}

const QUOTE_TIMEOUT_MS = 10_000;

export function subscribeToOmnistonStream(params: {
    baseUrl: string;
    fromAsset: string;
    toAsset: string;
    fromAmount: string;
    userAddress: string;
    slippageBps?: number;
    onQuote: (confirmation: SwapConfirmation) => void;
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

            params.onQuote(data as SwapConfirmation);
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
