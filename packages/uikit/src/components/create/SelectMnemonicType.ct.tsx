import { expect, test } from '../../../playwright/test';
import { SelectMnemonicType } from './SelectMnemonicType';

// The harness runs with `multichainEnabled: true`, so the BIP39 option is
// labelled by the product it creates ("Multichain Wallet") rather than by
// the seed standard.

test('SelectMnemonicType offers one button per available type', async ({ mount }) => {
    const c = await mount(
        <SelectMnemonicType availableTypes={['tonMnemonic', 'bip39']} onSelect={() => {}} />
    );

    await expect(c.getByRole('button', { name: 'Standard TON Mnemonic' })).toBeVisible();
    await expect(c.getByRole('button', { name: 'Multichain Wallet' })).toBeVisible();
    await expect(c.getByRole('button')).toHaveCount(2);
});

test('SelectMnemonicType reports the picked type', async ({ mount }) => {
    const picked: string[] = [];
    const c = await mount(
        <SelectMnemonicType
            availableTypes={['tonMnemonic', 'bip39']}
            onSelect={type => picked.push(type)}
        />
    );

    await c.getByRole('button', { name: 'Multichain Wallet' }).click();

    expect(picked).toEqual(['bip39']);
});

test('SelectMnemonicType hides the options while creating an account', async ({ mount }) => {
    const c = await mount(
        <SelectMnemonicType
            availableTypes={['tonMnemonic', 'bip39']}
            onSelect={() => {}}
            isLoading
        />
    );

    await expect(c.getByRole('button', { name: 'Multichain Wallet' })).toBeHidden();
});
