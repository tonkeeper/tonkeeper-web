/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { BtcWallet } from '../../../entries/btc/btc-wallet';
import { EvmWallet } from '../../../entries/evm/evm-wallet';
import { TonContract, TonWalletStandard, WalletVersion } from '../../../entries/wallet';
import { chainKitAddressTypeOfWallet } from '../chainKitClient';

const rawTon = `0:${'ab'.repeat(32)}`;

const tonWallet = (version: WalletVersion): TonWalletStandard => ({
    id: rawTon,
    rawAddress: rawTon,
    publicKey: 'cd'.repeat(32),
    version
});

describe('chainKitAddressTypeOfWallet', () => {
    it('maps a TON wallet to its contract version', () => {
        expect(chainKitAddressTypeOfWallet(tonWallet(WalletVersion.V5R1))).toBe('tonV5R1');
        expect(chainKitAddressTypeOfWallet(tonWallet(WalletVersion.V4R2))).toBe('tonV4R2');
    });

    it('falls back to default for TON versions chain-kit has no type for', () => {
        expect(chainKitAddressTypeOfWallet(tonWallet(WalletVersion.V3R2))).toBe('default');
        const contractOnly: TonContract = { id: rawTon, rawAddress: rawTon };
        expect(chainKitAddressTypeOfWallet(contractOnly)).toBe('default');
    });

    it('maps a Bitcoin wallet to segwit and single-address chains to default', () => {
        const btc: BtcWallet = {
            id: 'btc',
            chain: 'btc',
            rawAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            publicKey: '02'.repeat(17),
            derivationPath: "m/84'/0'/0'/0/0"
        };
        const evm: EvmWallet = {
            id: 'evm',
            chain: 'evm',
            rawAddress: '0x0000000000000000000000000000000000000001',
            publicKey: '04'.repeat(33),
            derivationPath: "m/44'/60'/0'/0/0"
        };
        expect(chainKitAddressTypeOfWallet(btc)).toBe('btcSegwit');
        expect(chainKitAddressTypeOfWallet(evm)).toBe('default');
    });
});
