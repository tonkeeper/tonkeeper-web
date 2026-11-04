import { SettingsVersionFooter } from './SettingsVersionFooter';
import { expect, screenshot, test } from '../../../../../playwright/test';

screenshot('Settings version footer', () => (
    <div className="w-[390px]">
        <SettingsVersionFooter />
    </div>
));

test('shows the app version', async ({ mount }) => {
    const c = await mount(<SettingsVersionFooter />);
    await expect(c.getByText(/Version/)).toBeVisible();
});
