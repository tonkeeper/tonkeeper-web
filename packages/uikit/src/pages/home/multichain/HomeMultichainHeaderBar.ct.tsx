import { expect, screenshot, test } from '../../../../playwright/test';
import { HomeMultichainHeaderBar } from './HomeMultichainHeaderBar';

// Edge cases the screenshot suite targets:
//   - the active account's emoji + name render in the centre wallet-picker
//     pill (seeded by the harness as the "Multichain" 🪐 account);
//   - the three icon buttons (scan QR, history, settings) sit left / right
//     with the picker centred and don't wrap.

screenshot('HomeMultichainHeaderBar default', () => (
    <div className="w-[390px]">
        <HomeMultichainHeaderBar />
    </div>
));

test('HomeMultichainHeaderBar shows the active account name and icon buttons', async ({
    mount
}) => {
    const c = await mount(
        <div className="w-[390px]">
            <HomeMultichainHeaderBar />
        </div>
    );
    await expect(c.getByText('Multichain')).toBeVisible();
    // Scan QR + wallet picker + history + settings.
    await expect(c.getByRole('button')).toHaveCount(4);
    // The scan entry point is conditional on the shell having a camera, so
    // assert it by name rather than relying on the count alone.
    await expect(c.getByRole('button', { name: 'Scan QR code' })).toBeVisible();
});
