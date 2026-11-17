import { describe, expect, it } from 'vitest';
import { loadAllNftPages } from '../nftPagination';

const makeItems = (count: number) =>
    Array.from({ length: count }, (_, i) => ({ address: `nft-${i}` }));

describe('complete NFT inventory pagination', () => {
    it.each([0, 1, 999, 1000, 1001, 2501])('complete inventory of %i', async count => {
        const items = makeItems(count);
        const offsets: number[] = [];
        const result = await loadAllNftPages(async (offset, limit) => {
            offsets.push(offset);
            expect(limit).toBe(1000);
            return items.slice(offset, offset + limit);
        });
        expect(result).toEqual(items);
        expect(offsets.at(-1)).toBe(count);
    });

    it('continues after short pages when the server uses a smaller page size', async () => {
        const items = makeItems(2501);
        const result = await loadAllNftPages(async offset => items.slice(offset, offset + 100));
        expect(result).toEqual(items);
    });

    it('deduplicates overlapping pages and advances by raw page length', async () => {
        const offsets: number[] = [];
        const pages = [
            [{ address: 'a' }, { address: 'b' }],
            [{ address: 'b' }, { address: 'c' }],
            []
        ];
        const result = await loadAllNftPages(async offset => {
            offsets.push(offset);
            return pages.shift()!;
        });
        expect(result.map(item => item.address)).toEqual(['a', 'b', 'c']);
        expect(offsets).toEqual([0, 2, 4]);
    });

    it('rejects a server that does not advance instead of looping or returning a partial total', async () => {
        let calls = 0;
        await expect(
            loadAllNftPages(async () => {
                calls += 1;
                return makeItems(1000);
            })
        ).rejects.toThrow('did not advance');
        expect(calls).toBe(2);
    });

    it('rejects a second-page failure and starts a fresh retry without partial items', async () => {
        let calls = 0;
        await expect(
            loadAllNftPages(async () => {
                if (++calls === 2) throw new Error('offline');
                return makeItems(1000);
            })
        ).rejects.toThrow('offline');
        expect(await loadAllNftPages(async () => [])).toEqual([]);
    });

    it('does not fetch an already cancelled request', async () => {
        const controller = new AbortController();
        controller.abort();
        let calls = 0;
        await expect(
            loadAllNftPages(async () => {
                calls += 1;
                return [];
            }, controller.signal)
        ).rejects.toMatchObject({ name: 'AbortError' });
        expect(calls).toBe(0);
    });

    it('honors cancellation during a page even if the transport ignores it', async () => {
        const controller = new AbortController();
        let calls = 0;
        await expect(
            loadAllNftPages(async (_offset, _limit, signal) => {
                calls += 1;
                expect(signal).toBe(controller.signal);
                controller.abort();
                return makeItems(1000);
            }, controller.signal)
        ).rejects.toMatchObject({ name: 'AbortError' });
        expect(calls).toBe(1);
    });

    it('keeps concurrent account inventories separate', async () => {
        const result = await Promise.all(
            ['account-a', 'account-b'].map(address =>
                loadAllNftPages(async offset => (offset ? [] : [{ address }]))
            )
        );
        expect(result).toEqual([[{ address: 'account-a' }], [{ address: 'account-b' }]]);
    });
});
