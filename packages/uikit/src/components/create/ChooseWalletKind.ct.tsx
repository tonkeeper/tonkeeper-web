import { expect, screenshotEachMode, test } from '../../../playwright/test';
import { ChooseWalletKindHarness, PreviewFixture } from './ChooseWalletKindHarness';

const funded: PreviewFixture = { fiatTotal: 1250.5 };
const fundedWithNfts: PreviewFixture = { fiatTotal: 42, nftsCount: 3 };
const empty: PreviewFixture = { fiatTotal: 0 };

screenshotEachMode('ChooseWalletKind', () => (
    <ChooseWalletKindHarness ton={funded} multichain={empty} />
));

test('ChooseWalletKind shows fiat and NFTs under a funded option and "No activity yet" under an empty one', async ({
    mount
}) => {
    const c = await mount(<ChooseWalletKindHarness ton={fundedWithNfts} multichain={empty} />);

    await expect(c.getByRole('radio', { name: 'TON wallet' })).toContainText('42');
    await expect(c.getByRole('radio', { name: 'TON wallet' })).toContainText('3 NFTs');
    await expect(c.getByRole('radio', { name: 'Multichain wallet' })).toContainText(
        'No activity yet'
    );
});

test('ChooseWalletKind lists and preselects multichain even when TON holds more', async ({
    mount
}) => {
    const c = await mount(<ChooseWalletKindHarness ton={funded} multichain={empty} />);

    const options = c.getByRole('radio');
    await expect(options.nth(0)).toHaveAccessibleName(/^Multichain wallet/);
    await expect(options.nth(1)).toHaveAccessibleName(/^TON wallet/);

    await expect(c.getByRole('radio', { name: 'Multichain wallet' })).toHaveAttribute(
        'aria-checked',
        'true'
    );
    await expect(c.getByRole('radio', { name: 'TON wallet' })).toHaveAttribute(
        'aria-checked',
        'false'
    );
});

test('ChooseWalletKind preselects multichain on a tie', async ({ mount }) => {
    const c = await mount(<ChooseWalletKindHarness ton={funded} multichain={funded} />);

    await expect(c.getByRole('radio', { name: 'Multichain wallet' })).toHaveAttribute(
        'aria-checked',
        'true'
    );
});

test('ChooseWalletKind continues with the preselected kind right away', async ({ mount }) => {
    const picked: string[] = [];
    const c = await mount(
        <ChooseWalletKindHarness
            ton={funded}
            multichain={empty}
            onContinue={kind => picked.push(kind)}
        />
    );

    await expect(c.getByRole('button', { name: 'Continue' })).toBeEnabled();
    await c.getByRole('button', { name: 'Continue' }).click();

    expect(picked).toEqual(['multichain']);
});

test('ChooseWalletKind continues with the kind the user switched to', async ({ mount }) => {
    const picked: string[] = [];
    const c = await mount(
        <ChooseWalletKindHarness
            ton={funded}
            multichain={empty}
            onContinue={kind => picked.push(kind)}
        />
    );

    await c.getByRole('radio', { name: 'TON wallet' }).click();
    await c.getByRole('button', { name: 'Continue' }).click();

    expect(picked).toEqual(['ton']);
});
