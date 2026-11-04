import { TradingFavoriteStub } from '../../../../state/trading/useTradingFavorites';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { TradeFavoriteCard } from './TradeFavoriteCard';

// Edge cases the screenshot suite targets:
//   - market batch in flight: the change line reserves its place as a
//     loading bar, so the card is already at its final two-line height.
//   - hydrated card shows the signed 24h change in the accent colour.
//   - stub-only render after the batch settled without this asset:
//     symbol without a change line.
//   - edit mode overlays the corner remove badge.

const stub: TradingFavoriteStub = {
    assetId: 'eth/mainnet/erc20/0xshib',
    symbol: 'SHIB',
    name: 'Shiba Inu',
    imageUrl: '',
    addedAt: 0
};

const market = {
    assetId: stub.assetId,
    assetType: 'asset' as const,
    symbol: 'SHIB',
    name: 'Shiba Inu',
    decimals: 18,
    image: '',
    isScam: false,
    verification: 'whitelist' as const,
    trustScore: 90,
    price: '0.005',
    change24hPercent: '1.91'
};

const STAGE = 'flex gap-2 bg-backgroundPage p-3';

screenshot('TradeFavoriteCard stub and hydrated', () => (
    <div className={STAGE}>
        <TradeFavoriteCard stub={stub} />
        <TradeFavoriteCard stub={stub} market={market} />
    </div>
));

screenshot('TradeFavoriteCard loading reserves the change line', () => (
    <div className={STAGE}>
        <TradeFavoriteCard stub={stub} marketLoading />
        <TradeFavoriteCard stub={stub} market={market} />
    </div>
));

screenshot('TradeFavoriteCard edit mode', () => (
    <div className={STAGE}>
        <TradeFavoriteCard stub={stub} market={market} editing onRemove={() => {}} />
    </div>
));

test('TradeFavoriteCard remove fires in edit mode instead of navigation', async ({ mount }) => {
    let removed = 0;
    const c = await mount(
        <div className={STAGE}>
            <TradeFavoriteCard stub={stub} editing onRemove={() => removed++} />
        </div>
    );
    await c.getByRole('button').click();
    expect(removed).toBe(1);
});
