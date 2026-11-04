import { PasswordInput } from './PasswordInput';
import { expect, screenshot, test } from '../../../playwright/test';

screenshot('PasswordInput empty', () => (
    <div className="w-[358px]">
        <PasswordInput id="p1" value="" onChange={() => {}} label="Password" />
    </div>
));
screenshot('PasswordInput filled hidden', () => (
    <div className="w-[358px]">
        <PasswordInput id="p2" value="secret123" onChange={() => {}} label="Password" />
    </div>
));
screenshot('PasswordInput error', () => (
    <div className="w-[358px]">
        <PasswordInput
            id="p3"
            value="12"
            onChange={() => {}}
            label="Password"
            isValid={false}
            helpText="Minimum 6 characters"
        />
    </div>
));

test('masks by default and reveals on toggle', async ({ mount }) => {
    const component = await mount(
        <PasswordInput id="p" value="secret123" label="Password" onChange={() => {}} />
    );
    const input = component.locator('input');
    const toggle = component.locator('button');

    await expect(input).toHaveAttribute('type', 'password');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(input).toHaveAttribute('type', 'text');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await expect(input).toHaveAttribute('type', 'password');
});

test('toggle keeps focus in the input', async ({ mount }) => {
    const component = await mount(
        <PasswordInput id="p" value="secret123" label="Password" onChange={() => {}} />
    );
    const input = component.locator('input');
    await input.focus();
    await component.locator('button').click();
    await expect(input).toBeFocused();
});

test('toggle is disabled with the input', async ({ mount }) => {
    const component = await mount(
        <PasswordInput id="p" value="secret123" label="Password" disabled onChange={() => {}} />
    );
    await expect(component.locator('button')).toBeDisabled();
});

test('toggle is skipped by Tab', async ({ mount, page }) => {
    const component = await mount(
        <div>
            <PasswordInput id="p1" value="" label="Password" onChange={() => {}} />
            <PasswordInput id="p2" value="" label="Confirm" onChange={() => {}} />
        </div>
    );
    await component.locator('#p1').focus();
    await page.keyboard.press('Tab');
    await expect(component.locator('#p2')).toBeFocused();
});
