import { Switch } from './Switch';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('Switch on', () => <Switch checked onChange={() => {}} />);
screenshot('Switch off', () => <Switch checked={false} onChange={() => {}} />);
screenshot('Switch disabled on', () => <Switch checked disabled onChange={() => {}} />);

test('Switch toggles on click and reports aria-checked', async ({ mount }) => {
    let next: boolean | undefined;
    const component = await mount(<Switch checked={false} onChange={v => (next = v)} />);

    await expect(component).toHaveAttribute('aria-checked', 'false');
    await component.click();
    expect(next).toBe(true);
});

test('disabled Switch does not fire onChange', async ({ mount }) => {
    let changed = false;
    const component = await mount(
        <Switch checked={false} disabled onChange={() => (changed = true)} />
    );

    await component.click({ force: true });
    expect(changed).toBe(false);
});
