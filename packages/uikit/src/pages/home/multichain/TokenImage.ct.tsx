import IcChainEth20 from '../../../icons/components/IcChainEth20';

import { expect, screenshot, test } from '../../../../playwright/test';
import { TokenImage } from './TokenImage';

// Edge cases the suite targets:
//   - no src and no fallback renders the placeholder glyph;
//   - no src with a fallback renders the caller's chain icon, not the glyph;
//   - a dead image URL swaps to the fallback when one exists, else to the
//     placeholder instead of the browser's broken-image icon.

screenshot('TokenImage placeholder', () => (
    <div className="bg-backgroundPage p-4">
        <TokenImage className="size-14" />
    </div>
));

test('TokenImage renders the fallback when src is missing', async ({ mount }) => {
    const c = await mount(
        <div className="bg-backgroundPage p-4">
            <TokenImage fallback={<IcChainEth20 />} className="size-14" />
        </div>
    );
    await expect(c.locator('svg')).toBeVisible();
    await expect(c.getByTestId('token-image-placeholder')).not.toBeAttached();
});

test('TokenImage draws the glyph for the backend placeholder art, even with a fallback', async ({
    mount
}) => {
    const c = await mount(
        <div className="bg-backgroundPage p-4">
            <TokenImage
                src="https://cache.tonapi.io/imgproxy/x/rs:fill:200:200:1/g:no/aHR0cHM6Ly90b25rZWVwZXIuY29tL2Fzc2V0cy90b2tlbnMvUGxhY2Vob2xkZXIucG5n.webp"
                fallback={<IcChainEth20 />}
                className="size-14"
            />
        </div>
    );
    await expect(c.getByTestId('token-image-placeholder')).toBeVisible();
    await expect(c.locator('img')).not.toBeAttached();
});

test('TokenImage swaps a dead URL for the placeholder', async ({ mount }) => {
    const c = await mount(
        <div className="bg-backgroundPage p-4">
            <TokenImage src="http://localhost/definitely-missing-token.png" className="size-14" />
        </div>
    );
    await expect(c.getByTestId('token-image-placeholder')).toBeVisible();
    await expect(c.locator('img')).not.toBeAttached();
});

test('TokenImage swaps a dead URL for the fallback when provided', async ({ mount }) => {
    const c = await mount(
        <div className="bg-backgroundPage p-4">
            <TokenImage
                src="http://localhost/definitely-missing-token.png"
                fallback={<IcChainEth20 />}
                className="size-14"
            />
        </div>
    );
    await expect(c.locator('svg')).toBeVisible();
    await expect(c.getByTestId('token-image-placeholder')).not.toBeAttached();
});
