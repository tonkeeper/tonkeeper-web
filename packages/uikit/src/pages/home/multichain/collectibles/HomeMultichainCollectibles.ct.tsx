import { NFT } from '@tonkeeper/core/dist/entries/nft';

import { expect, test } from '../../../../../playwright/test';
import { resolveHomeCollectiblesState } from './home-collectibles-utils';
import { HomeMultichainAllCollectiblesHidden } from './HomeMultichainAllCollectiblesHidden';

const NFT_ITEM = { address: `0:${'1'.repeat(64)}` } as NFT;

test('all-hidden row opens collectibles settings', async ({ mount }) => {
    let opened = 0;
    // The row is the component's root element; the div host keeps it
    // reachable as a descendant of the mount locator.
    const c = await mount(
        <div>
            <HomeMultichainAllCollectiblesHidden onClick={() => (opened += 1)} />
        </div>
    );

    await c.getByRole('button', { name: /All collectibles are hidden/ }).click();
    expect(opened).toBe(1);
});

test('resolves the all-hidden state only when the wallet still owns NFTs', () => {
    expect(resolveHomeCollectiblesState([], [NFT_ITEM])).toBe('all-hidden');
    expect(resolveHomeCollectiblesState([], [])).toBe('empty');
    expect(resolveHomeCollectiblesState([NFT_ITEM], [NFT_ITEM])).toBe('items');
    expect(resolveHomeCollectiblesState(undefined, [NFT_ITEM])).toBe('loading');
});
