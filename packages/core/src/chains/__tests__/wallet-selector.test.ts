/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { Account, AccountMultichain, AccountTonWatchOnly } from '../../entries/account';
import { EvmWallet } from '../../entries/evm/evm-wallet';
import { BtcWallet } from '../../entries/btc/btc-wallet';
import { MultichainTronWallet } from '../../entries/tron/multichain-tron-wallet';
import { SolWallet } from '../../entries/sol/sol-wallet';
import { TonContract, TonWalletStandard, WalletVersion } from '../../entries/wallet';
import { Network } from '../../entries/network';
import { CHAIN_IDS, ChainId } from '../types';
import { selectActiveWalletForChain } from '../wallet-selector';

const FIXTURE_TON_WALLET: TonWalletStandard = {
    id: 'fixture-wallet-id',
    rawAddress: '0:0000000000000000000000000000000000000000000000000000000000000000',
    publicKey: '00'.repeat(32),
    version: WalletVersion.V5R1,
    network: Network.MAINNET
};

const FIXTURE_TON_CONTRACT: TonContract = {
    id: 'fixture-contract-id',
    rawAddress: '0:1111111111111111111111111111111111111111111111111111111111111111'
};

const legacyWatchOnly: Account = new AccountTonWatchOnly(
    'acc:watch-only',
    'Watch',
    '🛰️',
    FIXTURE_TON_WALLET
);

const legacyContractWatchOnly: Account = new AccountTonWatchOnly(
    'acc:watch-only-contract',
    'Watch',
    '🛰️',
    FIXTURE_TON_CONTRACT
);

describe('chains/wallet-selector — legacy accounts', () => {
    it("returns the active wallet for chain 'ton' — parity with useActiveWallet()", () => {
        expect(selectActiveWalletForChain(legacyWatchOnly, 'ton')).toBe(FIXTURE_TON_WALLET);
    });

    it("preserves identity (===) for chain 'ton', no defensive cloning", () => {
        const result = selectActiveWalletForChain(legacyWatchOnly, 'ton');
        expect(result).toBe(FIXTURE_TON_WALLET);
    });

    it.each(CHAIN_IDS.filter((c): c is Exclude<ChainId, 'ton'> => c !== 'ton'))(
        'returns undefined for non-TON chain %s',
        chain => {
            expect(selectActiveWalletForChain(legacyWatchOnly, chain)).toBeUndefined();
        }
    );

    it('works on a non-standard TonContract (e.g. multisig parent shape)', () => {
        expect(selectActiveWalletForChain(legacyContractWatchOnly, 'ton')).toBe(
            FIXTURE_TON_CONTRACT
        );
    });
});

describe('chains/wallet-selector — multichain accounts', () => {
    const tonWallet: TonWalletStandard = {
        id: 'mc:ton',
        rawAddress: '0:abc',
        publicKey: 'ed25519-pubkey-hex',
        version: WalletVersion.V5R1,
        derivationPath: "m/44'/607'/0'"
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

    const account = AccountMultichain.create({
        id: 'acc:multichain',
        name: 'Multi',
        emoji: '🪐',
        auth: { kind: 'keychain', keychainStoreKey: 'mc-key' },
        enabledChains: ['ton', 'evm', 'btc', 'tron', 'sol'],
        activeWalletByChain: {
            ton: tonWallet.id,
            evm: evmWallet.id,
            btc: btcWallet.id,
            tron: tronWallet.id,
            sol: solWallet.id
        },
        wallets: [tonWallet, evmWallet, btcWallet, tronWallet, solWallet]
    });

    it.each([
        ['ton', tonWallet],
        ['evm', evmWallet],
        ['btc', btcWallet],
        ['tron', tronWallet],
        ['sol', solWallet]
    ] as const)('returns the active multichain wallet for %s', (chain, expected) => {
        expect(selectActiveWalletForChain(account, chain)).toBe(expected);
    });

    it('returns undefined when the chain is enabled but has no active wallet id', () => {
        const partial = AccountMultichain.create({
            id: 'acc:partial',
            name: 'Multi',
            emoji: '🪐',
            auth: { kind: 'keychain', keychainStoreKey: 'mc-key' },
            enabledChains: ['ton', 'evm'],
            activeWalletByChain: { ton: tonWallet.id },
            wallets: [tonWallet, evmWallet]
        });
        expect(selectActiveWalletForChain(partial, 'evm')).toBeUndefined();
    });
});
