import { SettingsListCell, SettingsListGroup } from './SettingsList';
import { SettingsListGroupHarness } from './SettingsListHarness';
import { expect, screenshot, test } from '../../../../../playwright/test';

screenshot('Settings list group', () => <SettingsListGroupHarness />);

test('interactive cell fires onClick, static cell renders no button', async ({ mount }) => {
    let clicks = 0;
    const c = await mount(
        <SettingsListGroup>
            <SettingsListCell title="Currency" rightText="USD" onClick={() => clicks++} />
            <SettingsListCell title="Static" rightText="—" />
        </SettingsListGroup>
    );
    await c.getByRole('button', { name: 'Currency' }).click();
    expect(clicks).toBe(1);
    await expect(c.getByRole('button', { name: 'Static' })).toHaveCount(0);
});
