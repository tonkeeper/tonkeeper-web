import { expect, screenshot, test } from '../../../../../playwright/test';
import { WalletAvatar } from './WalletAvatar';

// The colour comes from the account id when nothing is saved, so these
// render deterministically without seeding preferences.
screenshot('WalletAvatar sizes', () => (
    <div className="flex items-center gap-3">
        <WalletAvatar accountId="account-a" emoji="🙃" size={32} />
        <WalletAvatar accountId="account-b" emoji="🚀" />
        <WalletAvatar accountId="account-c" emoji="🐳" size={96} />
    </div>
));

screenshot('WalletAvatar explicit colour', () => (
    <WalletAvatar accountId="account-a" emoji="🙃" colorHex="#FF479D" />
));

test('WalletAvatar renders the emoji and honours an explicit colour', async ({ mount }) => {
    const c = await mount(<WalletAvatar accountId="account-a" emoji="🙃" colorHex="#FF479D" />);

    await expect(c.getByText('🙃')).toBeVisible();
    await expect(c).toHaveCSS('background-color', 'rgb(255, 71, 157)');
});

test('WalletAvatar gives the same account the same colour twice', async ({ mount }) => {
    const c = await mount(
        <div className="flex gap-3">
            <WalletAvatar accountId="account-a" emoji="🙃" />
            <WalletAvatar accountId="account-a" emoji="🚀" />
        </div>
    );

    const first = await c
        .locator('> div')
        .first()
        .evaluate(e => getComputedStyle(e).backgroundColor);
    const second = await c
        .locator('> div')
        .last()
        .evaluate(e => getComputedStyle(e).backgroundColor);
    expect(first).toBe(second);
});
