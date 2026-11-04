import { Network } from '@tonkeeper/core/dist/entries/network';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { CollectiblesSettingsGroup } from './collectibles-settings-utils';
import { MultichainCollectiblesSettingsView } from './MultichainCollectiblesSettingsView';

const noop = () => {};

const IMAGE =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="#7665E5"/></svg>'
    );

const group = (overrides: Partial<CollectiblesSettingsGroup>): CollectiblesSettingsGroup => ({
    address: '0:' + 'a1'.repeat(32),
    name: 'Telegram Usernames',
    image: IMAGE,
    count: 3,
    isSingle: false,
    isSpam: false,
    isHidden: false,
    ...overrides
});

const visible = [
    group({}),
    group({ address: '0:' + 'a2'.repeat(32), name: 'Lonely NFT', count: 1, isSingle: true })
];
const hidden = [group({ address: '0:' + 'a3'.repeat(32), name: 'Hidden things', isHidden: true })];
const spam = [
    group({ address: '0:' + 'a4'.repeat(32), name: 'Free Airdrop!!!', count: 1, isSpam: true })
];

screenshot('MultichainCollectiblesSettingsView all sections', () => (
    <div className="w-[390px]">
        <MultichainCollectiblesSettingsView
            network={Network.MAINNET}
            visible={visible}
            hidden={hidden}
            spam={spam}
            blacklistedCount={0}
            onBack={noop}
            onHide={noop}
            onShow={noop}
            onNotSpam={noop}
            onOpenAllSpam={noop}
        />
    </div>
));

screenshot('MultichainCollectiblesSettingsView visible only', () => (
    <div className="w-[390px]">
        <MultichainCollectiblesSettingsView
            network={Network.MAINNET}
            visible={visible}
            hidden={[]}
            spam={[]}
            blacklistedCount={0}
            onBack={noop}
            onHide={noop}
            onShow={noop}
            onNotSpam={noop}
            onOpenAllSpam={noop}
        />
    </div>
));

test('remove and add buttons hide and show groups', async ({ mount }) => {
    const hidden_: string[] = [];
    const shown: string[] = [];
    const c = await mount(
        <MultichainCollectiblesSettingsView
            network={Network.MAINNET}
            visible={[visible[0]]}
            hidden={hidden}
            spam={[]}
            blacklistedCount={0}
            onBack={noop}
            onHide={g => hidden_.push(g.address)}
            onShow={g => shown.push(g.address)}
            onNotSpam={noop}
            onOpenAllSpam={noop}
        />
    );
    await c.getByRole('button', { name: 'remove' }).click();
    await c.getByRole('button', { name: 'add' }).click();
    expect(hidden_).toEqual([visible[0].address]);
    expect(shown).toEqual([hidden[0].address]);
});

test('visible and hidden rows open details with the matching action', async ({ mount, page }) => {
    const hidden_: string[] = [];
    const shown: string[] = [];
    const c = await mount(
        <MultichainCollectiblesSettingsView
            network={Network.MAINNET}
            visible={[visible[0]]}
            hidden={hidden}
            spam={[]}
            blacklistedCount={0}
            onBack={noop}
            onHide={g => hidden_.push(g.address)}
            onShow={g => shown.push(g.address)}
            onNotSpam={noop}
            onOpenAllSpam={noop}
        />
    );

    await c.getByRole('button', { name: 'Telegram Usernames' }).click();
    await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Hide collection from wallet' })
        .click();
    expect(hidden_).toEqual([visible[0].address]);
    await expect(page.getByRole('dialog')).toHaveCount(0);

    await c.getByRole('button', { name: 'Hidden things' }).click();
    await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Show collection in wallet' })
        .click();
    expect(shown).toEqual([hidden[0].address]);
});

test('known spam opens details and can be marked as not spam', async ({ mount, page }) => {
    const trusted: string[] = [];
    const c = await mount(
        <MultichainCollectiblesSettingsView
            network={Network.MAINNET}
            visible={[]}
            hidden={[]}
            spam={spam}
            blacklistedCount={0}
            onBack={noop}
            onHide={noop}
            onShow={noop}
            onNotSpam={g => trusted.push(g.address)}
            onOpenAllSpam={noop}
        />
    );

    await c.getByRole('button', { name: 'Free Airdrop!!!' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Not Spam' }).click();
    expect(trusted).toEqual([spam[0].address]);
});

test('blacklisted NFTs stay aggregated and open the collectibles explorer', async ({ mount }) => {
    let opened = 0;
    const c = await mount(
        <MultichainCollectiblesSettingsView
            network={Network.MAINNET}
            visible={[]}
            hidden={[]}
            spam={[]}
            blacklistedCount={7}
            onBack={noop}
            onHide={noop}
            onShow={noop}
            onNotSpam={noop}
            onOpenAllSpam={() => (opened += 1)}
        />
    );

    await c.getByRole('button', { name: /All spam/ }).click();
    expect(opened).toBe(1);
});
