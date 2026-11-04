/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { ChainId } from '../../chains/types';
import {
    AccountMultichain,
    isAccountBip39,
    isAccountSupportTonConnect,
    isAccountTonWalletStandard,
    isAccountTronCompatible,
    isAccountVersionEditable,
    isMnemonicAndPassword,
    isSecretBearingAccount,
    getNetworkByAccount
} from '../account';
import { BtcWallet } from '../btc/btc-wallet';
import { EvmWallet } from '../evm/evm-wallet';
import { Network } from '../network';
import { SolWallet } from '../sol/sol-wallet';
import { MultichainTronWallet } from '../tron/multichain-tron-wallet';
import { TonWalletStandard, WalletVersion } from '../wallet';

const tonWallet: TonWalletStandard = {
    id: 'mc:ton',
    rawAddress: '0:abc',
    publicKey: 'ed25519-pubkey-hex',
    version: WalletVersion.V5R1,
    derivationPath: "m/44'/607'/0'"
};
const tonWalletAlt: TonWalletStandard = {
    ...tonWallet,
    id: 'mc:ton-alt',
    version: WalletVersion.V4R2
};
const evmWallet: EvmWallet = {
    id: 'mc:evm',
    chain: 'evm',
    rawAddress: '0xAbCdEf0000000000000000000000000000000000',
    publicKey: '04' + '00'.repeat(64),
    derivationPath: "m/44'/60'/0'/0/0"
};
const btcWallet: BtcWallet = {
    id: 'mc:btc',
    chain: 'btc',
    rawAddress: 'bc1q0000000000000000000000000000000000000',
    publicKey: '02' + '00'.repeat(32),
    derivationPath: "m/84'/0'/0'/0/0"
};
const tronWallet: MultichainTronWallet = {
    id: 'mc:tron',
    chain: 'tron',
    rawAddress: 'TXY00000000000000000000000000000000000',
    publicKey: '02' + '00'.repeat(32),
    derivationPath: "m/44'/195'/0'/0/0"
};
const solWallet: SolWallet = {
    id: 'mc:sol',
    chain: 'sol',
    rawAddress: 'So11111111111111111111111111111111111111112',
    publicKey: '00'.repeat(32),
    derivationPath: "m/44'/501'/0'/0'"
};

const ALL_CHAINS: ChainId[] = ['ton', 'evm', 'btc', 'tron', 'sol'];

function makeAccount(
    enabledChains: ChainId[] = ALL_CHAINS,
    overrides: {
        wallets?: AccountMultichain['wallets'];
        activeWalletByChain?: AccountMultichain['activeWalletByChain'];
    } = {}
) {
    return AccountMultichain.create({
        id: 'acc:multichain',
        name: 'Multi',
        emoji: '🪐',
        auth: { kind: 'keychain', keychainStoreKey: 'mc-key' },
        enabledChains,
        activeWalletByChain: overrides.activeWalletByChain ?? {
            ton: tonWallet.id,
            evm: evmWallet.id,
            btc: btcWallet.id,
            tron: tronWallet.id,
            sol: solWallet.id
        },
        wallets: overrides.wallets ?? [tonWallet, evmWallet, btcWallet, tronWallet, solWallet]
    });
}

describe('AccountMultichain — construction invariants', () => {
    it('constructs with all chains enabled and one wallet per chain', () => {
        const account = makeAccount();
        expect(account.type).toBe('multichain');
        expect(account.enabledChains).toEqual(ALL_CHAINS);
        expect(account.wallets).toHaveLength(5);
    });

    it("throws when 'ton' is missing from enabledChains (v1 invariant)", () => {
        expect(() =>
            AccountMultichain.create({
                id: 'acc:no-ton',
                name: 'Multi',
                emoji: '🪐',
                auth: { kind: 'keychain', keychainStoreKey: 'k' },
                enabledChains: ['evm', 'btc'],
                activeWalletByChain: { evm: evmWallet.id },
                wallets: [evmWallet, btcWallet]
            })
        ).toThrow(/requires 'ton'/);
    });

    it('throws when wallets has no TonWalletStandard', () => {
        expect(() =>
            AccountMultichain.create({
                id: 'acc:ton-missing',
                name: 'Multi',
                emoji: '🪐',
                auth: { kind: 'keychain', keychainStoreKey: 'k' },
                enabledChains: ['ton', 'evm'],
                activeWalletByChain: { ton: 'missing-id', evm: evmWallet.id },
                wallets: [evmWallet]
            })
        ).toThrow(/at least one TonWalletStandard/);
    });

    it('throws when activeWalletByChain.ton is unset', () => {
        expect(() =>
            AccountMultichain.create({
                id: 'acc:no-active-ton',
                name: 'Multi',
                emoji: '🪐',
                auth: { kind: 'keychain', keychainStoreKey: 'k' },
                enabledChains: ['ton', 'evm'],
                activeWalletByChain: { evm: evmWallet.id },
                wallets: [tonWallet, evmWallet]
            })
        ).toThrow(/activeWalletByChain\.ton/);
    });

    it('throws when activeWalletByChain.ton points to a non-existent wallet', () => {
        expect(() =>
            AccountMultichain.create({
                id: 'acc:bad-active-ton',
                name: 'Multi',
                emoji: '🪐',
                auth: { kind: 'keychain', keychainStoreKey: 'k' },
                enabledChains: ['ton'],
                activeWalletByChain: { ton: 'nonexistent' },
                wallets: [tonWallet]
            })
        ).toThrow(/does not match any TON wallet/);
    });
});

describe('AccountMultichain — IAccountTonWalletStandard contract', () => {
    it('allTonWallets filters to TonWalletStandard entries only', () => {
        const account = makeAccount(ALL_CHAINS, {
            wallets: [tonWallet, tonWalletAlt, evmWallet, btcWallet, tronWallet, solWallet]
        });
        expect(account.allTonWallets).toEqual([tonWallet, tonWalletAlt]);
    });

    it('activeTonWallet returns the wallet pointed to by activeWalletByChain.ton', () => {
        const account = makeAccount(ALL_CHAINS, {
            wallets: [tonWallet, tonWalletAlt, evmWallet, btcWallet, tronWallet, solWallet],
            activeWalletByChain: {
                ton: tonWalletAlt.id,
                evm: evmWallet.id,
                btc: btcWallet.id,
                tron: tronWallet.id,
                sol: solWallet.id
            }
        });
        expect(account.activeTonWallet).toBe(tonWalletAlt);
    });

    it('getTonWallet returns wallets by id, undefined for misses', () => {
        const account = makeAccount(ALL_CHAINS, {
            wallets: [tonWallet, tonWalletAlt, evmWallet, btcWallet, tronWallet, solWallet]
        });
        expect(account.getTonWallet(tonWallet.id)).toBe(tonWallet);
        expect(account.getTonWallet(tonWalletAlt.id)).toBe(tonWalletAlt);
        // Multichain non-TON wallets are not addressable via getTonWallet.
        expect(account.getTonWallet(evmWallet.id)).toBeUndefined();
        expect(account.getTonWallet('nope')).toBeUndefined();
    });

    it('setActiveTonWallet flips activeWalletByChain.ton', () => {
        const account = makeAccount(ALL_CHAINS, {
            wallets: [tonWallet, tonWalletAlt, evmWallet, btcWallet, tronWallet, solWallet]
        });
        account.setActiveTonWallet(tonWalletAlt.id);
        expect(account.activeTonWallet).toBe(tonWalletAlt);
        expect(account.activeWalletByChain.ton).toBe(tonWalletAlt.id);
    });

    it('setActiveTonWallet throws when target id is not a TonWalletStandard on the account', () => {
        const account = makeAccount();
        expect(() => account.setActiveTonWallet(evmWallet.id)).toThrow(/Wallet not found/);
        expect(() => account.setActiveTonWallet('does-not-exist')).toThrow(/Wallet not found/);
    });
});

describe('AccountMultichain.getWalletByChain', () => {
    const account = makeAccount();

    it.each([
        ['ton', tonWallet],
        ['evm', evmWallet],
        ['btc', btcWallet],
        ['tron', tronWallet],
        ['sol', solWallet]
    ] as const)('returns the active wallet for %s', (chain, expected) => {
        expect(account.getWalletByChain(chain)).toBe(expected);
    });

    it('returns undefined when the chain has no active wallet id', () => {
        const minimal = makeAccount(['ton'], {
            wallets: [tonWallet],
            activeWalletByChain: { ton: tonWallet.id }
        });
        expect(minimal.getWalletByChain('evm')).toBeUndefined();
        expect(minimal.getWalletByChain('btc')).toBeUndefined();
    });

    it('returns undefined when the active id points to a missing wallet', () => {
        const broken = makeAccount(['ton', 'evm'], {
            wallets: [tonWallet],
            activeWalletByChain: { ton: tonWallet.id, evm: 'phantom-id' }
        });
        expect(broken.getWalletByChain('evm')).toBeUndefined();
    });

    it('returns undefined when the active id points to a different chain wallet', () => {
        const broken = makeAccount(['ton', 'evm', 'btc'], {
            wallets: [tonWallet, evmWallet, btcWallet],
            activeWalletByChain: { ton: tonWallet.id, evm: btcWallet.id, btc: evmWallet.id }
        });

        expect(broken.getWalletByChain('evm')).toBeUndefined();
        expect(broken.getWalletByChain('btc')).toBeUndefined();
    });
});

describe('AccountMultichain — Account union predicates', () => {
    const account = makeAccount();

    it('isAccountTonWalletStandard → true', () => {
        expect(isAccountTonWalletStandard(account)).toBe(true);
    });

    it('isAccountVersionEditable → false (multichain wallet ops go through getWalletByChain)', () => {
        expect(isAccountVersionEditable(account)).toBe(false);
    });

    it('isAccountSupportTonConnect → true (TON dApps connect via TonConnect)', () => {
        expect(isAccountSupportTonConnect(account)).toBe(true);
    });

    it('isMnemonicAndPassword → false (legacy mnemonic edit flows gated)', () => {
        expect(isMnemonicAndPassword(account)).toBe(false);
    });

    // The password services must see multichain accounts even though the
    // legacy edit-flow predicate above hides them: when they diverged, a
    // multichain-only profile rejected its own correct password.
    it('isSecretBearingAccount → true (secret is app-password encrypted)', () => {
        expect(isSecretBearingAccount(account)).toBe(true);
    });

    it('isAccountTronCompatible → false (legacy TRON channel only)', () => {
        expect(isAccountTronCompatible(account)).toBe(false);
    });

    it('isAccountBip39 → true (multichain seed is BIP39 by construction)', () => {
        expect(isAccountBip39(account)).toBe(true);
    });

    it('getNetworkByAccount → MAINNET', () => {
        expect(getNetworkByAccount(account)).toBe(Network.MAINNET);
    });
});

describe('AccountMultichain.clone', () => {
    it('preserves prototype and isolates state', () => {
        const account = makeAccount();
        const copy = account.clone();
        expect(copy).toBeInstanceOf(AccountMultichain);
        expect(copy.id).toBe(account.id);

        copy.setActiveTonWallet(tonWallet.id);
        const account2 = makeAccount(ALL_CHAINS, {
            wallets: [tonWallet, tonWalletAlt, evmWallet, btcWallet, tronWallet, solWallet]
        });
        const copy2 = account2.clone();
        copy2.setActiveTonWallet(tonWalletAlt.id);
        expect(account2.activeWalletByChain.ton).toBe(tonWallet.id);
        expect(copy2.activeWalletByChain.ton).toBe(tonWalletAlt.id);
    });
});
