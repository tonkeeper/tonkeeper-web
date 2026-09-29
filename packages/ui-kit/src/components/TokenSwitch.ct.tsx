import { TokenSwitch } from './TokenSwitch';
import { expect, screenshot, test } from '../../playwright/test';

// Plain host elements for the icon/badge slots — Playwright CT can only mount
// real imported components, not ones defined in the test file, so the stand-in
// glyphs must be inline <span>s rather than local components.
const iconEl = <span className="block h-6 w-6 rounded-full bg-accentBlue" />;
const badgeEl = <span className="block h-3 w-3 rounded-full bg-accentGreen" />;

screenshot('TokenSwitch native', () => (
    <TokenSwitch icon={iconEl} symbol="TON" onClick={() => {}} />
));
screenshot('TokenSwitch with chain badge', () => (
    <TokenSwitch icon={iconEl} chainBadge={badgeEl} symbol="SHIB" onClick={() => {}} />
));
screenshot('TokenSwitch disabled', () => (
    <TokenSwitch icon={iconEl} symbol="TON" disabled onClick={() => {}} />
));

test('TokenSwitch fires onClick', async ({ mount }) => {
    let clicked = false;
    const component = await mount(
        <TokenSwitch icon={iconEl} symbol="TON" onClick={() => (clicked = true)} />
    );
    await component.click();
    expect(clicked).toBe(true);
});

test('disabled TokenSwitch does not fire onClick', async ({ mount }) => {
    let clicked = false;
    const component = await mount(
        <TokenSwitch icon={iconEl} symbol="TON" disabled onClick={() => (clicked = true)} />
    );
    await component.click({ force: true });
    expect(clicked).toBe(false);
});
