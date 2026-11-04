import { expect, screenshot, test } from '../../../../../playwright/test';
import { BrowserConnectedEmpty } from './BrowserConnectedView';
import { BrowserSearchBar, BrowserSearchButton } from './BrowserSearchBar';
import { BrowserSearchBarHarness } from './BrowserSearchBarHarness';

// Edge cases this suite targets:
//   - the "Search or enter address" field in its resting state.
//   - the compact button the desktop catalog docks instead of that field.
//   - submitting a bare domain normalizes it to https and fires onOpenUrl;
//     a plain search query submits to nothing (typing drives the results
//     list instead).
//   - the Connected tab's empty state block (Figma "Browser/Connected/Empty").

const WRAP = 'w-[390px] bg-backgroundPage p-4';

screenshot('BrowserSearchBar resting', () => (
    <div className={WRAP}>
        <BrowserSearchBar value="" onChange={() => {}} onOpenUrl={() => {}} />
    </div>
));

screenshot('BrowserSearchButton compact', () => (
    <div className={WRAP}>
        <BrowserSearchButton onClick={() => {}} />
    </div>
));

screenshot('BrowserConnectedEmpty state', () => (
    <div className={WRAP}>
        <BrowserConnectedEmpty />
    </div>
));

test('submitting a bare domain opens it as https', async ({ mount }) => {
    let opened: string | undefined;
    const c = await mount(<BrowserSearchBarHarness onOpenUrl={url => (opened = url)} />);
    await c.getByRole('searchbox').fill('getgems.io');
    await c.getByRole('searchbox').press('Enter');
    expect(opened).toBe('https://getgems.io');
});

test('submitting a plain query does not open a URL', async ({ mount }) => {
    let opened: string | undefined;
    const c = await mount(<BrowserSearchBarHarness onOpenUrl={url => (opened = url)} />);
    await c.getByRole('searchbox').fill('staking apps');
    await c.getByRole('searchbox').press('Enter');
    expect(opened).toBeUndefined();
});
