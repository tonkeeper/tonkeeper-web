import { expect, screenshotEachMode, test } from '../../../playwright/test';
import { MultichainReceiveSheet } from './MultichainReceiveSheet';

// Edge cases the screenshot suite targets:
//   - the open sheet shows the chain-list step (heading + subtitle + the
//     receive chain rows) inside the shared Modal;
//   - desktop and mobile both render the dialog (Modal is responsive).
// The per-chain QR step is the ReceiveChainAddress component, covered by
// its own test; here we only assert the list→address navigation happens.

screenshotEachMode(
    'MultichainReceiveSheet chain list',
    () => <MultichainReceiveSheet isOpen onClose={() => {}} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('MultichainReceiveSheet opens to the chain list', async ({ mount, page }) => {
    await mount(<MultichainReceiveSheet isOpen onClose={() => {}} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Bitcoin')).toBeVisible();
    await expect(dialog.getByText('Ethereum')).toBeVisible();
});

test('MultichainReceiveSheet selecting a chain switches to the address step', async ({
    mount,
    page
}) => {
    await mount(<MultichainReceiveSheet isOpen onClose={() => {}} />);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /Ethereum/ }).click();
    // The chain list is replaced by the per-chain QR view, so the other
    // chain rows are gone.
    await expect(dialog.getByText('Bitcoin')).toBeHidden();
});

test('MultichainReceiveSheet with a pinned chain opens on that address with no back arrow', async ({
    mount,
    page
}) => {
    await mount(<MultichainReceiveSheet isOpen onClose={() => {}} chain="btc" />);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: /Bitcoin/ })).toBeVisible();
    await expect(dialog.getByText('Ethereum')).toBeHidden();
    await expect(dialog.getByRole('button', { name: /back/i })).toHaveCount(0);
});
