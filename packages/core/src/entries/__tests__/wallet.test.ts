/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { MultichainTronWallet } from '../tron/multichain-tron-wallet';
import { EvmWallet } from '../evm/evm-wallet';
import { BtcWallet } from '../btc/btc-wallet';
import { SolWallet } from '../sol/sol-wallet';
import {
    MultichainWallet,
    TonWalletStandard,
    WalletVersion,
    isBtcWallet,
    isEvmWallet,
    isSolWallet,
    isStandardTonWallet,
    isTronWallet
} from '../wallet';

const tonWallet: TonWalletStandard = {
    id: 'ton:0:abc',
    rawAddress: '0:abcdef',
    publicKey: 'ed25519-pubkey-hex',
    version: WalletVersion.V5R1
};

const tonWalletMultichain: TonWalletStandard = {
    ...tonWallet,
    derivationPath: "m/44'/607'/0'"
};

const evmWallet: EvmWallet = {
    id: 'evm:0xabc',
    chain: 'evm',
    rawAddress: '0xAbCdEf0000000000000000000000000000000000',
    publicKey: '04' + '00'.repeat(64),
    derivationPath: "m/44'/60'/0'/0/0"
};

const btcWallet: BtcWallet = {
    id: 'btc:bc1q',
    chain: 'btc',
    rawAddress: 'bc1qexampleaddress0000000000000000000000',
    publicKey: '02' + '00'.repeat(32),
    derivationPath: "m/84'/0'/0'/0/0"
};

const solWallet: SolWallet = {
    id: 'sol:abc',
    chain: 'sol',
    rawAddress: 'So11111111111111111111111111111111111111112',
    publicKey: '00'.repeat(32),
    derivationPath: "m/44'/501'/0'/0'"
};

const tronWallet: MultichainTronWallet = {
    id: 'tron:TXYZ',
    chain: 'tron',
    rawAddress: 'TXYZ1234567890abcdefghijklmnopqrstuvwx',
    publicKey: '02' + '00'.repeat(32),
    derivationPath: "m/44'/195'/0'/0/0"
};

describe('isStandardTonWallet', () => {
    it('accepts a legacy TON wallet without derivationPath', () => {
        expect(isStandardTonWallet(tonWallet)).toBe(true);
    });

    it('accepts a multichain TON wallet with derivationPath', () => {
        expect(isStandardTonWallet(tonWalletMultichain)).toBe(true);
    });

    it('rejects EVM / BTC / SOL wallets', () => {
        expect(isStandardTonWallet(evmWallet as unknown as TonWalletStandard)).toBe(false);
        expect(isStandardTonWallet(btcWallet as unknown as TonWalletStandard)).toBe(false);
        expect(isStandardTonWallet(solWallet as unknown as TonWalletStandard)).toBe(false);
    });
});

describe('isEvmWallet', () => {
    it('matches only EVM', () => {
        const wallets: MultichainWallet[] = [
            tonWallet,
            tonWalletMultichain,
            evmWallet,
            btcWallet,
            solWallet,
            tronWallet
        ];
        const matched = wallets.filter(isEvmWallet);
        expect(matched).toEqual([evmWallet]);
    });
});

describe('isBtcWallet', () => {
    it('matches only BTC', () => {
        const wallets: MultichainWallet[] = [
            tonWallet,
            evmWallet,
            btcWallet,
            solWallet,
            tronWallet
        ];
        const matched = wallets.filter(isBtcWallet);
        expect(matched).toEqual([btcWallet]);
    });
});

describe('isSolWallet', () => {
    it('matches only SOL', () => {
        const wallets: MultichainWallet[] = [
            tonWallet,
            evmWallet,
            btcWallet,
            solWallet,
            tronWallet
        ];
        const matched = wallets.filter(isSolWallet);
        expect(matched).toEqual([solWallet]);
    });
});

describe('isTronWallet', () => {
    it('matches only the multichain TRON wallet', () => {
        const wallets: MultichainWallet[] = [
            tonWallet,
            tonWalletMultichain,
            evmWallet,
            btcWallet,
            solWallet,
            tronWallet
        ];
        const matched = wallets.filter(isTronWallet);
        expect(matched).toEqual([tronWallet]);
    });

    it('rejects every other chain-tagged wallet', () => {
        expect(isTronWallet(evmWallet)).toBe(false);
        expect(isTronWallet(btcWallet)).toBe(false);
        expect(isTronWallet(solWallet)).toBe(false);
    });

    it('rejects TON wallets', () => {
        expect(isTronWallet(tonWallet)).toBe(false);
        expect(isTronWallet(tonWalletMultichain)).toBe(false);
    });
});

describe('TonWalletStandard.derivationPath round-trip', () => {
    it('serializes without derivationPath when absent (legacy shape)', () => {
        const json = JSON.stringify(tonWallet);
        const parsed = JSON.parse(json) as TonWalletStandard;
        expect(parsed).toEqual(tonWallet);
        expect('derivationPath' in parsed).toBe(false);
    });

    it('serializes with derivationPath when present (multichain shape)', () => {
        const json = JSON.stringify(tonWalletMultichain);
        const parsed = JSON.parse(json) as TonWalletStandard;
        expect(parsed).toEqual(tonWalletMultichain);
        expect(parsed.derivationPath).toBe("m/44'/607'/0'");
    });

    it('round-trips legacy on-disk shape without derivationPath', () => {
        const onDisk = JSON.parse(JSON.stringify(tonWallet));
        const asTyped: TonWalletStandard = onDisk;
        expect(asTyped.derivationPath).toBeUndefined();
    });
});

describe('MultichainWallet exhaustive narrowing', () => {
    it('every shape lands in exactly one branch', () => {
        const wallets: MultichainWallet[] = [
            tonWallet,
            evmWallet,
            btcWallet,
            solWallet,
            tronWallet
        ];
        for (const w of wallets) {
            const tags = [
                isStandardTonWallet(w as TonWalletStandard),
                isEvmWallet(w),
                isBtcWallet(w),
                isSolWallet(w),
                isTronWallet(w)
            ];
            const matches = tags.filter(Boolean).length;
            expect(matches).toBe(1);
        }
    });
});
