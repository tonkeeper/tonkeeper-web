import { Toast } from './Toast';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('Toast small', () => <Toast text="Label" size="small" />);
screenshot('Toast medium', () => <Toast text="Label" size="medium" />);
screenshot('Toast loading', () => <Toast text="Loading" loading />);
screenshot('Toast action', () => (
    <Toast text="Disconnect “Mercuryo”?" action={{ label: 'Disconnect', onClick: () => {} }} />
));

test('Toast renders its text with a status role', async ({ mount }) => {
    const component = await mount(<Toast text="Copied" size="small" />);
    await expect(component).toHaveAttribute('role', 'status');
    await expect(component).toContainText('Copied');
});

test('Toast action button fires onClick', async ({ mount }) => {
    let clicks = 0;
    const component = await mount(
        <Toast text="Disconnect?" action={{ label: 'Disconnect', onClick: () => (clicks += 1) }} />
    );
    await component.getByRole('button', { name: 'Disconnect' }).click();
    expect(clicks).toBe(1);
});
