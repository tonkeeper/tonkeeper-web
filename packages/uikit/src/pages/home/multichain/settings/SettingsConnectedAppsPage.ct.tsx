import type { Locator } from 'playwright-core';

import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { SettingsConnectedAppsPage } from './SettingsConnectedAppsPage';

// The connection providers (TonConnect, WalletConnect, injected EVM) hold
// no sessions under the ct providers, so the page settles on the empty
// state. WalletConnect resolves its session store asynchronously, so the
// snapshot waits for the empty state instead of racing the loader. The
// Connect dApp button is not part of this page: the browser page docks it
// in place of its search control.
const waitForEmptyState = async (c: Locator) => {
    await expect(c.getByText('Connected apps will be shown here')).toBeVisible({
        timeout: 20_000
    });
};

screenshotEachMode(
    'SettingsConnectedAppsPage empty',
    () => <SettingsConnectedAppsPage />,
    ['desktop', 'mobile'],
    { interact: waitForEmptyState }
);

test('renders the settings chrome around the empty connections list', async ({ mount }) => {
    const c = await mount(<SettingsConnectedAppsPage compact />);
    await expect(c.getByText('Connected Apps', { exact: true })).toBeVisible();
    await waitForEmptyState(c);
    await expect(c.getByRole('button', { name: 'Connect dApp' })).toHaveCount(0);
});
