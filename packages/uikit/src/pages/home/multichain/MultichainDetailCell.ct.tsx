import { expect, test } from '../../../../playwright/test';
import { MultichainDetailCell } from './MultichainDetailCell';

const LONG_HEX = `0x${'abcd'.repeat(16)}`;

test('MultichainDetailCell does not ellipsize the value', async ({ mount }) => {
    const c = await mount(
        <div className="w-[280px]">
            <MultichainDetailCell label="Recipient" value={LONG_HEX} last />
        </div>
    );
    const value = c.locator('span').nth(1);
    await expect(value).not.toHaveClass(/truncate/);
    await expect(value).toContainText(LONG_HEX);
});
