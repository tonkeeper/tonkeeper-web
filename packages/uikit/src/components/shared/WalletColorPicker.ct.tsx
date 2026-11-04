import { WALLET_COLORS } from '@tonkeeper/core/dist/entries/walletColor';

import { expect, screenshot, test } from '../../../playwright/test';
import { WalletColorPickerHarness } from './WalletColorPickerHarness';

screenshot('WalletColorPicker default', () => (
    <div className="w-[390px]">
        <WalletColorPickerHarness initial="lightPurple" />
    </div>
));

test('WalletColorPicker renders every palette colour', async ({ mount }) => {
    const c = await mount(
        <div className="w-[390px]">
            <WalletColorPickerHarness initial="lightPurple" />
        </div>
    );
    await expect(c.getByRole('button')).toHaveCount(WALLET_COLORS.length);
});

test('WalletColorPicker marks only the selected colour as pressed', async ({ mount }) => {
    const c = await mount(
        <div className="w-[390px]">
            <WalletColorPickerHarness initial="lightPurple" />
        </div>
    );

    await expect(c.getByRole('button', { name: 'Light Purple' })).toHaveAttribute(
        'aria-pressed',
        'true'
    );
    await expect(c.getByRole('button', { name: 'Red', exact: true })).toHaveAttribute(
        'aria-pressed',
        'false'
    );

    await c.getByRole('button', { name: 'Red', exact: true }).click();

    await expect(c.getByRole('button', { name: 'Red', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true'
    );
    await expect(c.getByRole('button', { name: 'Light Purple' })).toHaveAttribute(
        'aria-pressed',
        'false'
    );
});
