/**
 * Load a complete account inventory before publishing it to the query cache.
 * Offsets count server rows, not unique items: adjacent pages may overlap while
 * ownership changes. An empty page is the end marker, even if the server uses
 * a smaller page size than requested.
 */
export async function loadAllNftPages<T extends { address: string }>(
    fetchPage: (offset: number, limit: number, signal?: AbortSignal) => Promise<T[]>,
    signal?: AbortSignal
): Promise<T[]> {
    const byAddress = new Map<string, T>();
    let offset = 0;

    const checkCancelled = () => {
        if (signal?.aborted) {
            throw new DOMException('NFT loading cancelled', 'AbortError');
        }
    };

    for (;;) {
        checkCancelled();
        const page = await fetchPage(offset, 1000, signal);
        checkCancelled();
        if (page.length === 0) return Array.from(byAddress.values());

        const previousSize = byAddress.size;
        for (const nft of page) byAddress.set(nft.address, nft);
        if (byAddress.size === previousSize) {
            // A server ignoring offset must not produce an infinite loop or a
            // successful but truncated inventory. Let the query expose a retry.
            throw new Error('NFT pagination did not advance');
        }
        offset += page.length;
    }
}
