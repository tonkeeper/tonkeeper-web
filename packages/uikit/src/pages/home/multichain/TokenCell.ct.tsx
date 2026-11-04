import { expect, screenshot, test } from '../../../../playwright/test';
import { SkeletonScope, ChainChip } from '../../../primitives';
import { TokenCell, TokenCellIcon } from './TokenCell';

// Edge cases the screenshot suite targets:
//   - loaded cell vs loading cell in the same card → the mask bars must not
//     change the cell's 76px geometry (the loading state is the real layout).
//   - loading hides chip, secondary value and accessory; avatar, title,
//     subtitle and value paint as bars in the content-tint fill.
//   - long symbol next to a chain chip → `truncate` engages instead of
//     pushing the right column out.

const CARD = 'w-[360px] overflow-hidden rounded-medium bg-backgroundContent';
const NARROW = 'w-[280px] overflow-hidden rounded-medium bg-backgroundContent';
const CARD_LOADING = `${CARD} [--tk-skeleton-fill:var(--tk-background-content-tint)]`;

screenshot('TokenCell loaded baseline', () => (
    <div className={CARD}>
        <TokenCell
            icon={<TokenCellIcon assetId="eth/mainnet/erc20/0xdead" image="" />}
            title="USDT"
            titleExtras={<ChainChip label="TRC20" />}
            subtitle="$1.00 · +0.01%"
            rightPrimary="2 345"
            rightSecondary="$2,345.67"
        />
    </div>
));

screenshot('TokenCell loading masks values and drops extras', () => (
    <SkeletonScope loading>
        <div className={CARD_LOADING}>
            <TokenCell
                icon={<TokenCellIcon assetId="eth/mainnet/erc20/0xdead" image="" />}
                title="TOKEN"
                titleExtras={<ChainChip label="TRC20" />}
                subtitle="$2.34 · +1.23%"
                rightPrimary="2 345"
                rightSecondary="$2,345.67"
                accessory={<span className="size-7 rounded-full bg-accentBlue" />}
            />
        </div>
    </SkeletonScope>
));

screenshot('TokenCell long symbol truncates beside chip', () => (
    <div className={NARROW}>
        <TokenCell
            icon={<TokenCellIcon assetId="eth/mainnet/erc20/0xdead" image="" />}
            title="SUPERLONGTOKENSYMBOL"
            titleExtras={<ChainChip label="ERC20" />}
            subtitle="Very Long Token Display Name Inc."
            rightPrimary="12 345 678"
        />
    </div>
));

screenshot('TokenCell accessory only, no right column', () => (
    <div className={CARD}>
        <TokenCell
            icon={<TokenCellIcon assetId="ton/mainnet/coin" image="" />}
            title="TON"
            subtitle="4.53 TON · $24.60"
            selected
            accessory={<span className="size-6 rounded-full bg-accentBlue" />}
        />
    </div>
));

test('TokenCell loading and loaded cells keep the same geometry', async ({ mount }) => {
    const c = await mount(
        <div className={CARD_LOADING}>
            <div data-testid="loaded">
                <TokenCell
                    icon={<TokenCellIcon assetId="ton/mainnet/coin" image="" />}
                    title="TON"
                    subtitle="$5.43 · +2.34%"
                    rightPrimary="4.53"
                    rightSecondary="$24.60"
                />
            </div>
            <SkeletonScope loading>
                <div data-testid="loading">
                    <TokenCell
                        icon={<TokenCellIcon assetId="ton/mainnet/coin" image="" />}
                        title="TOKEN"
                        subtitle="$2.34 · +1.23%"
                        rightPrimary="2 345"
                        rightSecondary="$2,345.67"
                    />
                </div>
            </SkeletonScope>
        </div>
    );

    const loaded = await c.getByTestId('loaded').boundingBox();
    const loading = await c.getByTestId('loading').boundingBox();
    expect(loaded).not.toBeNull();
    expect(loading).not.toBeNull();
    expect(Math.abs(loaded!.height - loading!.height)).toBeLessThanOrEqual(1);

    // Avatar, title, subtitle and the right primary value.
    await expect(c.getByTestId('loading').locator('[data-skeleton]')).toHaveCount(4);
});
