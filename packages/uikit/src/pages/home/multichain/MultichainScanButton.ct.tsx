import { expect, screenshot, test } from '../../../../playwright/test';
import { MultichainScanButtonHarness } from './MultichainScanButtonHarness';

screenshot('MultichainScanButton default', () => <MultichainScanButtonHarness />);

test('MultichainScanButton asks the shell to open the scanner', async ({ mount }) => {
    const c = await mount(<MultichainScanButtonHarness />);

    await expect(c.getByText('Scans: 0')).toBeVisible();
    await c.getByRole('button', { name: 'Scan QR code' }).click();
    await expect(c.getByText('Scans: 1')).toBeVisible();
});
