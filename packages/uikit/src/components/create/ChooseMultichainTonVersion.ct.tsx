import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { expect, screenshotEachMode, test } from '../../../playwright/test';
import { ChooseMultichainTonVersion, TonVersionOption } from './ChooseMultichainTonVersion';

const W5_ADDRESS = '0:c0ffee0000000000000000000000000000000000000000000000000000000001';
const V4R2_ADDRESS = '0:c0ffee0000000000000000000000000000000000000000000000000000000002';

const options: TonVersionOption[] = [
    {
        version: WalletVersion.V5R1,
        address: W5_ADDRESS,
        tonBalance: 153_000_000,
        hasJettons: false
    },
    {
        version: WalletVersion.V4R2,
        address: V4R2_ADDRESS,
        tonBalance: 1_290_000_000,
        hasJettons: true
    }
];

screenshotEachMode('ChooseMultichainTonVersion', () => (
    <ChooseMultichainTonVersion options={options} network={Network.MAINNET} onSubmit={() => {}} />
));

screenshotEachMode('ChooseMultichainTonVersion loading', () => (
    <ChooseMultichainTonVersion options={undefined} network={Network.MAINNET} onSubmit={() => {}} />
));

test('ChooseMultichainTonVersion lists W5 first and preselects it', async ({ mount }) => {
    const c = await mount(
        <ChooseMultichainTonVersion
            options={options}
            network={Network.MAINNET}
            onSubmit={() => {}}
        />
    );

    const radios = c.getByRole('radio');
    await expect(radios).toHaveCount(2);
    await expect(radios.nth(0)).toContainText('W5');
    await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'true');
    await expect(radios.nth(1)).toContainText('v4R2');
    await expect(radios.nth(1)).toContainText('tokens');
    await expect(radios.nth(1)).toHaveAttribute('aria-checked', 'false');
});

test('ChooseMultichainTonVersion submits the version the user switched to', async ({ mount }) => {
    const picked: WalletVersion[] = [];
    const c = await mount(
        <ChooseMultichainTonVersion
            options={options}
            network={Network.MAINNET}
            onSubmit={v => picked.push(v)}
        />
    );

    await c.getByRole('radio', { name: /v4R2/ }).click();
    await c.getByRole('button', { name: 'Continue' }).click();

    expect(picked).toEqual([WalletVersion.V4R2]);
});

test('ChooseMultichainTonVersion keeps Continue disabled until holdings load', async ({
    mount
}) => {
    const c = await mount(
        <ChooseMultichainTonVersion
            options={undefined}
            network={Network.MAINNET}
            onSubmit={() => {}}
        />
    );

    await expect(c.getByRole('button', { name: 'Continue' })).toBeDisabled();
});
