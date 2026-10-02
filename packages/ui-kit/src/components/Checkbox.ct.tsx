import { Checkbox, Radio } from './Checkbox';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('Checkbox checked', () => <Checkbox checked onChange={() => {}} />);
screenshot('Checkbox unchecked', () => <Checkbox checked={false} onChange={() => {}} />);
screenshot('Checkbox disabled checked', () => <Checkbox checked disabled onChange={() => {}} />);
screenshot('Checkbox with label', () => (
    <Checkbox checked onChange={() => {}}>
        I agree
    </Checkbox>
));

screenshot('Radio check checked', () => <Radio checked onChange={() => {}} />);
screenshot('Radio check unchecked', () => <Radio checked={false} onChange={() => {}} />);
screenshot('Radio dot checked', () => <Radio variant="dot" checked onChange={() => {}} />);

test('Checkbox toggles on click', async ({ mount }) => {
    let next: boolean | undefined;
    const component = await mount(<Checkbox checked={false} onChange={v => (next = v)} />);
    await component.click();
    expect(next).toBe(true);
});

test('disabled Checkbox does not fire onChange', async ({ mount }) => {
    let changed = false;
    const component = await mount(
        <Checkbox checked={false} disabled onChange={() => (changed = true)} />
    );
    await component.click();
    expect(changed).toBe(false);
});

test('Radio toggles on click', async ({ mount }) => {
    let next: boolean | undefined;
    const component = await mount(<Radio checked={false} onChange={v => (next = v)} />);
    await component.click();
    expect(next).toBe(true);
});
