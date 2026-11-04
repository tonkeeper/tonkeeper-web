import { TronApiHttpError } from '../errors/TronApiHttpError';
import { delay } from '../utils/common';

/**
 * Keyless TronGrid throttles per API method: the 429 body says "allowed_rps(1)", and spacing of
 * exactly 1000ms still fails while 1200ms is reliably clean, so requests are paced with a margin.
 */
const MIN_REQUEST_INTERVAL_MS = 1250;

const MAX_RETRIES = 2;

const MAX_COOLDOWN_MS = 10_000;

/**
 * TronGrid suspends a method for a few seconds after a 429; 1-2s retries land inside that window
 * and fail again, so rate-limit pauses start from 3s.
 */
const RATE_LIMIT_BASE_COOLDOWN_MS = 3000;

/** A repeated broadcast can duplicate a transaction that did reach the chain. */
const NON_RETRYABLE_PATHS = ['wallet/broadcasttransaction', 'wallet/broadcasthex'];

const SUSPENSION_PATTERN = /suspended for\s*(\d+(?:\.\d+)?)\s*s/i;

/** Address-like path segments are collapsed so each TronGrid method shares one pacing slot. */
export const tronGridMethodKey = (url: URL): string =>
    url.origin +
    url.pathname
        .split('/')
        .map(segment => (segment.length >= 25 ? '*' : segment))
        .join('/');

/**
 * The cooldown TronGrid announces in `Retry-After` or, more often, in the 429 body:
 * "the request rate of (getAccount) has been suspended for 1 s".
 */
export const parseTronGridCooldownMs = (
    retryAfter: string | null,
    body: string
): number | undefined => {
    const header = retryAfter?.trim();
    if (header) {
        const seconds = Number(header);
        if (Number.isFinite(seconds) && seconds >= 0) {
            return seconds * 1000;
        }
    }
    const match = SUSPENSION_PATTERN.exec(body.slice(0, 8192));
    return match ? Number(match[1]) * 1000 : undefined;
};

/**
 * An announced cooldown raises the rate-limit pause but never lowers it: the 3s floor was
 * measured, the announced rate was not reliable.
 */
export const tronGridRetryCooldownMs = ({
    attempt,
    status,
    announcedMs
}: {
    attempt: number;
    status?: number;
    announcedMs?: number;
}): number => {
    const exponential = 1000 * 2 ** attempt;
    const rateLimitFloor =
        status === 429 ? Math.max(RATE_LIMIT_BASE_COOLDOWN_MS * 2 ** attempt, announcedMs ?? 0) : 0;
    return Math.min(Math.max(exponential, rateLimitFloor), MAX_COOLDOWN_MS);
};

const isRetryable = (url: URL) => !NON_RETRYABLE_PATHS.some(path => url.pathname.endsWith(path));

const isRetryableStatus = (status: number) => status === 429 || status >= 500;

export const createTronGridFetch = ({
    fetchImpl = (input, init) => fetch(input, init),
    sleep = delay,
    now = Date.now
}: {
    fetchImpl?: (input: URL, init?: RequestInit) => Promise<Response>;
    sleep?: (ms: number) => Promise<unknown>;
    now?: () => number;
} = {}) => {
    const nextAllowedAtByMethod = new Map<string, number>();

    const waitForPermit = async (methodKey: string) => {
        const current = now();
        const scheduled = Math.max(current, nextAllowedAtByMethod.get(methodKey) ?? 0);
        nextAllowedAtByMethod.set(methodKey, scheduled + MIN_REQUEST_INTERVAL_MS);
        if (scheduled > current) {
            await sleep(scheduled - current);
        }
    };

    return async (input: string | URL, init?: RequestInit): Promise<Response> => {
        const url = new URL(input.toString());
        const methodKey = tronGridMethodKey(url);
        const retryable = isRetryable(url);

        for (let attempt = 0; ; attempt++) {
            await waitForPermit(methodKey);

            let response: Response;
            try {
                response = await fetchImpl(url, init);
            } catch (e) {
                if (!retryable || attempt >= MAX_RETRIES) {
                    throw e instanceof TypeError ? new TronApiHttpError(0, e.message) : e;
                }
                // The cooldown stays per request: pushing it into the shared pacing would
                // stall every TRON call in the app behind one throttled method.
                await sleep(tronGridRetryCooldownMs({ attempt }));
                continue;
            }

            if (response.ok) {
                return response;
            }

            const body = await response.text().catch(() => '');
            if (!retryable || attempt >= MAX_RETRIES || !isRetryableStatus(response.status)) {
                throw new TronApiHttpError(
                    response.status,
                    body
                        ? `TronGrid HTTP error ${response.status}: ${body.slice(0, 200)}`
                        : undefined
                );
            }

            await sleep(
                tronGridRetryCooldownMs({
                    attempt,
                    status: response.status,
                    announcedMs: parseTronGridCooldownMs(response.headers.get('Retry-After'), body)
                })
            );
        }
    };
};

/** Shared by every TronApi instance: TronGrid's limits apply per client IP, not per instance. */
export const tronFetch = createTronGridFetch();
