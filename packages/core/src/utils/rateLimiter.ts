export interface SlidingWindowRateLimiter {
    /**
     * Records a call for the given key and reports whether it is allowed.
     * Returns `true` when the call is within the limit, `false` when the key
     * has already reached `maxRequests` within the trailing `windowMs`.
     */
    tryConsume(key: string): boolean;
}

/**
 * In-memory per-key sliding-window rate limiter.
 *
 * Keeps the timestamps of recent calls per key and allows a new call only when
 * fewer than `maxRequests` fall inside the trailing `windowMs` window. State
 * lives in the returned instance, so create one limiter per logical bucket.
 */
export const createSlidingWindowRateLimiter = (options: {
    windowMs: number;
    maxRequests: number;
}): SlidingWindowRateLimiter => {
    const { windowMs, maxRequests } = options;
    const timestamps = new Map<string, number[]>();

    return {
        tryConsume(key: string): boolean {
            const windowStart = Date.now() - windowMs;
            const recent = (timestamps.get(key) ?? []).filter(t => t > windowStart);

            if (recent.length >= maxRequests) {
                timestamps.set(key, recent);
                return false;
            }

            recent.push(Date.now());
            timestamps.set(key, recent);
            return true;
        }
    };
};
