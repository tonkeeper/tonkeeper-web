import { AddRemoveButton } from './AddRemoveButton';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('AddRemoveButton add', () => <AddRemoveButton type="add" />);
screenshot('AddRemoveButton remove', () => <AddRemoveButton type="remove" />);
screenshot('AddRemoveButton disabled', () => <AddRemoveButton type="add" disabled />);

test('AddRemoveButton forwards onClick', async ({ mount }) => {
    let clicks = 0;
    const component = await mount(<AddRemoveButton type="add" onClick={() => (clicks += 1)} />);
    await component.click();
    expect(clicks).toBe(1);
});

test('disabled AddRemoveButton is not clickable', async ({ mount }) => {
    const component = await mount(<AddRemoveButton type="remove" disabled />);
    await expect(component).toBeDisabled();
});
