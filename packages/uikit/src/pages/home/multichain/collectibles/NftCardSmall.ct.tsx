import { NFT } from '@tonkeeper/core/dist/entries/nft';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { NftCardSmall } from './NftCardSmall';

// Edge cases the screenshot suite targets:
//   - sale badge pinned to the image's top-right corner over the artwork.
//   - long name / collection → `truncate` engages instead of wrapping and
//     stretching the 166px card.
//   - missing preview image → the tinted placeholder keeps the square
//     aspect so the grid doesn't collapse.
//   - missing collection → the second line keeps its height, the footer
//     doesn't shrink.

// Deterministic stand-in for the NFT preview: a flat-color data-URI SVG,
// so screenshots never depend on the network.
const PREVIEW =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#7665E5"/></svg>'
    );

const sampleNft = (overrides: Record<string, unknown>): NFT =>
    ({
        address: '0:nft-card-small-fixture',
        previews: [{ resolution: '500x500', url: PREVIEW }],
        metadata: { name: 'Plush Pepe #23' },
        collection: { address: '0:collection', name: 'Telegram Usernames' },
        trust: 'whitelist',
        ...overrides
    } as unknown as NFT);

screenshot('NftCardSmall baseline', () => (
    <NftCardSmall nft={sampleNft({})} className="w-[114px]" />
));

screenshot('NftCardSmall on sale shows badge', () => (
    <NftCardSmall nft={sampleNft({ sale: { address: '0:sale' } })} className="w-[114px]" />
));

screenshot('NftCardSmall long name and collection truncate', () => (
    <NftCardSmall
        nft={sampleNft({
            metadata: { name: 'Extraordinarily Long Collectible Name #99999' },
            collection: {
                address: '0:collection',
                name: 'An Unreasonably Verbose Collection Title'
            }
        })}
        className="w-[114px]"
    />
));

screenshot('NftCardSmall without image keeps square placeholder', () => (
    <NftCardSmall nft={sampleNft({ previews: undefined })} className="w-[114px]" />
));

screenshot('NftCardSmall without collection keeps footer height', () => (
    <NftCardSmall nft={sampleNft({ collection: undefined })} className="w-[114px]" />
));

test('NftCardSmall fires onClick', async ({ mount }) => {
    let clicks = 0;
    const c = await mount(<NftCardSmall nft={sampleNft({})} onClick={() => (clicks += 1)} />);
    await c.click();
    expect(clicks).toBe(1);
});
