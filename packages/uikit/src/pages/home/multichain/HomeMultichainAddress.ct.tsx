import { expect, screenshot, test } from '../../../../playwright/test';
import { HomeMultichainAddress } from './HomeMultichainAddress';

// Edge cases the screenshot suite targets:
//   - the seeded account's TON address renders shortened (4…4) with the
//     switch chevrons right after it, in the secondary caption style;
//   - the row is centred under the total by the parent, so the fixture
//     mirrors that alignment.

screenshot('HomeMultichainAddress default', () => (
    <div className="flex w-[390px] justify-center bg-backgroundPage">
        <HomeMultichainAddress />
    </div>
));

// The mount locator resolves to the component's single root element — here
// the address button itself — so the behaviour tests mount inside a plain
// <div> host to query the button as a descendant.
test('HomeMultichainAddress shows the shortened TON address', async ({ mount }) => {
    const c = await mount(
        <div>
            <HomeMultichainAddress />
        </div>
    );
    await expect(c.getByRole('button')).toContainText('…');
});

test('HomeMultichainAddress opens the receiving-address sheet on tap', async ({ mount, page }) => {
    const c = await mount(
        <div>
            <HomeMultichainAddress />
        </div>
    );
    await c.getByRole('button').click();
    // The sheet portals outside the mounted subtree.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Receiving address');
    await expect(dialog).toContainText('One address per network');
});
