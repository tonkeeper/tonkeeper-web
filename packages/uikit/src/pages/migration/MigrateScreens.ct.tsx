import { expect, screenshotEachMode, test } from '../../../playwright/test';
import {
    MigrateAlreadyHere,
    MigrateConfirm,
    MigrateNotMine,
    MigrateNoWallets,
    MigrateOffer,
    MigratePassword,
    MigrateRejected,
    MigrateWaiting
} from './MigrateScreens';

// Edge cases the suite targets:
//   - every step of `/migrate`, in both modes, because the card switches from a
//     centred panel to the full viewport.
//   - the offer explains the move (title, old → new address, button) only when the old
//     origin said wallets are there, and a popup that was blocked or closed swaps
//     the description for a notice.
//   - the confirm list mixes kinds (multichain chip, no chip, a multi-wallet
//     count instead of an address) and notes accounts that were already here.
//   - the password step clears the field after a wrong password, and never
//     submits an empty one.

const HOST = 'wallet.tonkeeper.com';
const NEW_HOST = 'web.keeperwallet.com';
const noop = () => undefined;

const WALLETS = [
    { id: 'a', name: 'Main', emoji: '😀', type: 'multichain' as const, label: 'UQBx…4f2a' },
    { id: 'b', name: 'Savings', emoji: '🦊', type: 'mnemonic' as const, label: '3 wallets' },
    { id: 'c', name: 'Ledger', emoji: '🔒', type: 'ledger' as const }
];

screenshotEachMode('MigrateOffer found', () => (
    <MigrateOffer host={HOST} newHost={NEW_HOST} found onContinue={noop} onNotNow={noop} />
));

screenshotEachMode('MigrateOffer manual', () => (
    <MigrateOffer host={HOST} newHost={NEW_HOST} found={false} onContinue={noop} onNotNow={noop} />
));

screenshotEachMode('MigrateOffer blocked', () => (
    <MigrateOffer
        host={HOST}
        newHost={NEW_HOST}
        found
        notice="blocked"
        onContinue={noop}
        onNotNow={noop}
    />
));

screenshotEachMode('MigrateWaiting', () => <MigrateWaiting host={HOST} onCancel={noop} />);

screenshotEachMode('MigrateConfirm several', () => (
    <MigrateConfirm host={HOST} wallets={WALLETS} alreadyHere={2} onAdd={noop} onNotMine={noop} />
));

screenshotEachMode('MigrateConfirm single', () => (
    <MigrateConfirm
        host={HOST}
        wallets={WALLETS.slice(0, 1)}
        alreadyHere={0}
        onAdd={noop}
        onNotMine={noop}
    />
));

screenshotEachMode('MigrateNotMine', () => (
    <MigrateNotMine host={HOST} onMoveManually={noop} onContinueWithout={noop} />
));

screenshotEachMode('MigrateAlreadyHere', () => (
    <MigrateAlreadyHere host={HOST} onContinue={noop} />
));

screenshotEachMode('MigrateNoWallets', () => (
    <MigrateNoWallets host={HOST} onRestoreWithPhrase={noop} onBack={noop} />
));

screenshotEachMode('MigrateRejected', () => (
    <MigrateRejected onTryAgain={noop} onRestoreWithPhrase={noop} />
));

screenshotEachMode('MigratePassword wrong', () => (
    <MigratePassword
        host={HOST}
        checking={false}
        failed
        onSubmit={noop}
        onPasswordChange={noop}
        onCancel={noop}
    />
));

test('MigrateOffer explains the move and wires both buttons', async ({ mount }) => {
    const calls: string[] = [];
    const c = await mount(
        <MigrateOffer
            host={HOST}
            newHost={NEW_HOST}
            found
            onContinue={() => calls.push('continue')}
            onNotNow={() => calls.push('not-now')}
        />
    );
    await expect(c.getByRole('heading')).toHaveText('Tonkeeper Web has moved');
    await expect(c).toContainText(`${HOST} → ${NEW_HOST}`);
    await expect(c).toContainText('Your wallets are still at the old address.');
    await c.getByRole('button', { name: 'Move my wallets' }).click();
    await c.getByRole('button', { name: 'Not now' }).click();
    expect(calls).toEqual(['continue', 'not-now']);
});

test('MigrateOffer shows the closed-window notice', async ({ mount }) => {
    const c = await mount(
        <MigrateOffer
            host={HOST}
            newHost={NEW_HOST}
            found
            notice="closed"
            onContinue={noop}
            onNotNow={noop}
        />
    );
    await expect(c).toContainText('The window closed before your wallets were moved.');
});

test('MigrateConfirm lists every wallet and titles by count', async ({ mount }) => {
    const calls: string[] = [];
    const c = await mount(
        <MigrateConfirm
            host={HOST}
            wallets={WALLETS}
            alreadyHere={1}
            onAdd={() => calls.push('add')}
            onNotMine={() => calls.push('not-mine')}
        />
    );
    await expect(c.getByRole('listitem')).toHaveCount(3);
    await expect(c).toContainText(`From ${HOST}`);
    await expect(c).toContainText('1 more was already in this app');
    await c.getByRole('button', { name: 'Add wallets' }).click();
    await c.getByRole('button', { name: "These aren't my wallets" }).click();
    expect(calls).toEqual(['add', 'not-mine']);
});

test('MigratePassword submits the typed password, never an empty one', async ({ mount }) => {
    const submitted: string[] = [];
    const c = await mount(
        <MigratePassword
            host={HOST}
            checking={false}
            failed={false}
            onSubmit={password => submitted.push(password)}
            onPasswordChange={noop}
            onCancel={noop}
        />
    );
    const add = c.getByRole('button', { name: 'Add wallets' });
    await expect(add).toBeDisabled();
    await c.locator('input[type="password"]').fill('123456');
    await c.locator('input[type="password"]').press('Enter');
    expect(submitted).toEqual(['123456']);
});

test('MigratePassword clears the field after a wrong password', async ({ mount }) => {
    const c = await mount(
        <MigratePassword
            host={HOST}
            checking={false}
            failed={false}
            onSubmit={noop}
            onPasswordChange={noop}
            onCancel={noop}
        />
    );
    const field = c.locator('input[type="password"]');
    await field.fill('wrong');
    await c.update(
        <MigratePassword
            host={HOST}
            checking={false}
            failed
            onSubmit={noop}
            onPasswordChange={noop}
            onCancel={noop}
        />
    );
    await expect(field).toHaveValue('');
    await expect(c).toContainText('Wrong password');
});
