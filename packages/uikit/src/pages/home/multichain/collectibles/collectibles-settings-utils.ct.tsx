import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { defaultPreferencesConfig, TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';

import { expect, test } from '../../../../../playwright/test';
import { groupCollectiblesForSettings } from './collectibles-settings-utils';

const COLLECTION = '0:' + 'b2'.repeat(32);
const SINGLE = '0:' + 'c3'.repeat(32);

const nft = (overrides: Record<string, unknown>): NFT =>
    ({
        address: '0:' + 'a1'.repeat(32),
        metadata: { name: 'Item' },
        trust: 'whitelist',
        ...overrides
    } as unknown as NFT);

const config = (overrides: Partial<TonWalletConfig> = {}): TonWalletConfig => ({
    ...defaultPreferencesConfig,
    ...overrides
});

test('groups collection items into one row and counts them', () => {
    const sections = groupCollectiblesForSettings(
        [
            nft({
                address: '0:' + '11'.repeat(32),
                collection: { address: COLLECTION, name: 'C' }
            }),
            nft({
                address: '0:' + '22'.repeat(32),
                collection: { address: COLLECTION, name: 'C' }
            }),
            nft({ address: SINGLE })
        ],
        config()
    );

    expect(sections.visible).toHaveLength(2);
    const collection = sections.visible.find(g => g.address === COLLECTION)!;
    expect(collection.count).toBe(2);
    expect(collection.isSingle).toBe(false);
    const single = sections.visible.find(g => g.address === SINGLE)!;
    expect(single.count).toBe(1);
    expect(single.isSingle).toBe(true);
});

test('a blacklisted collection is aggregated instead of exposing its NFT rows', () => {
    const sections = groupCollectiblesForSettings(
        [
            nft({
                address: '0:' + '11'.repeat(32),
                collection: { address: COLLECTION, name: 'C' }
            }),
            nft({
                address: '0:' + '22'.repeat(32),
                collection: { address: COLLECTION, name: 'C' },
                trust: 'blacklist'
            })
        ],
        config()
    );

    expect(sections.visible).toHaveLength(0);
    expect(sections.spam).toHaveLength(0);
    expect(sections.blacklistedCount).toBe(2);
});

test('graylisted single is spam, matching the gallery filter', () => {
    const sections = groupCollectiblesForSettings(
        [nft({ address: SINGLE, trust: 'graylist' })],
        config()
    );

    expect(sections.spam).toHaveLength(1);
    expect(sections.visible).toHaveLength(0);
});

test('user trust overrides the blacklist verdict', () => {
    const sections = groupCollectiblesForSettings(
        [nft({ address: SINGLE, trust: 'blacklist' })],
        config({ trustedNfts: [SINGLE] })
    );

    expect(sections.visible).toHaveLength(1);
    expect(sections.spam).toHaveLength(0);
});

test('hidden collections land in the hidden section', () => {
    const sections = groupCollectiblesForSettings(
        [nft({ address: '0:' + '11'.repeat(32), collection: { address: COLLECTION, name: 'C' } })],
        config({ hiddenNfts: [COLLECTION] })
    );

    expect(sections.hidden).toHaveLength(1);
    expect(sections.visible).toHaveLength(0);
});

test('collection image falls back to the first item that has one', () => {
    const sections = groupCollectiblesForSettings(
        [
            nft({
                address: '0:' + '11'.repeat(32),
                collection: { address: COLLECTION, name: 'C' }
            }),
            nft({
                address: '0:' + '22'.repeat(32),
                collection: { address: COLLECTION, name: 'C' },
                previews: [{ resolution: '100x100', url: 'https://img.example/1.png' }]
            })
        ],
        config()
    );

    expect(sections.visible[0].image).toBe('https://img.example/1.png');
});
