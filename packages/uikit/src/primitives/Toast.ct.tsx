import { Toast } from './Toast';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('Toast small', () => <Toast text="Label" size="small" />);
screenshot('Toast medium', () => <Toast text="Label" size="medium" />);
screenshot('Toast loading', () => <Toast text="Loading" loading />);

test('Toast renders its text with a status role', async ({ mount }) => {
    const component = await mount(<Toast text="Copied" size="small" />);
    await expect(component).toHaveAttribute('role', 'status');
    await expect(component).toContainText('Copied');
});
