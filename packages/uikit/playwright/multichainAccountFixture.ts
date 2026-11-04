import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { BtcWallet } from '@tonkeeper/core/dist/entries/btc/btc-wallet';
import { EvmWallet } from '@tonkeeper/core/dist/entries/evm/evm-wallet';
import { MultichainTronWallet } from '@tonkeeper/core/dist/entries/tron/multichain-tron-wallet';
import { TonWalletStandard, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';

/**
 * A fully-populated `AccountMultichain` (TON + EVM + BTC + TRON) used as the
 * default active account in component tests. Components that read
 * `useActiveAccount()` — the home portfolio header, the receive sheet, the
 * balance row — need a real multichain account on disk to render; without
 * one `useActiveAccount` throws "No active account". The TON `rawAddress` is a
 * valid workchain:hex pair so `formatAddress` resolves it for the receive QR.
 */
const tonWallet: TonWalletStandard = {
    id: 'mc:ton',
    rawAddress: `0:${'a'.repeat(64)}`,
    publicKey: 'ed25519-pubkey-hex',
    version: WalletVersion.V5R1,
    derivationPath: "m/44'/607'/0'"
};

const evmWallet: EvmWallet = {
    id: 'mc:evm',
    chain: 'evm',
    rawAddress: '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01',
    publicKey: `04${'00'.repeat(64)}`,
    derivationPath: "m/44'/60'/0'/0/0"
};

const btcWallet: BtcWallet = {
    id: 'mc:btc',
    chain: 'btc',
    rawAddress: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    publicKey: `02${'00'.repeat(32)}`,
    derivationPath: "m/84'/0'/0'/0/0"
};

const tronWallet: MultichainTronWallet = {
    id: 'mc:tron',
    chain: 'tron',
    rawAddress: 'TXYZopYRFdT9bvfTV5K7g7uL8tszbnAd2D',
    publicKey: `02${'00'.repeat(32)}`,
    derivationPath: "m/44'/195'/0'/0/0"
};

export const buildActiveMultichainAccount = (): AccountMultichain =>
    AccountMultichain.create({
        id: 'acc:multichain-ct',
        name: 'Multichain',
        emoji: '🪐',
        auth: { kind: 'keychain', keychainStoreKey: 'mc-ct-key' },
        enabledChains: ['ton', 'evm', 'btc', 'tron'],
        activeWalletByChain: {
            ton: tonWallet.id,
            evm: evmWallet.id,
            btc: btcWallet.id,
            tron: tronWallet.id
        },
        wallets: [tonWallet, evmWallet, btcWallet, tronWallet],
        multichainWalletId: 'aiaqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    });

/**
 * Additional multichain accounts for multi-account scenarios (folders,
 * switching). Wallet ids are prefixed with the account id so accounts
 * don't collide; the on-chain addresses are shared — no ct scenario
 * resolves them across accounts.
 */
export const buildMultichainAccount = (params: {
    id: string;
    name: string;
    emoji: string;
}): AccountMultichain =>
    AccountMultichain.create({
        id: params.id,
        name: params.name,
        emoji: params.emoji,
        auth: { kind: 'keychain', keychainStoreKey: `${params.id}-key` },
        enabledChains: ['ton', 'evm', 'btc', 'tron'],
        activeWalletByChain: {
            ton: `${params.id}:ton`,
            evm: `${params.id}:evm`,
            btc: `${params.id}:btc`,
            tron: `${params.id}:tron`
        },
        wallets: [
            { ...tonWallet, id: `${params.id}:ton` },
            { ...evmWallet, id: `${params.id}:evm` },
            { ...btcWallet, id: `${params.id}:btc` },
            { ...tronWallet, id: `${params.id}:tron` }
        ],
        multichainWalletId: 'aiaqaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    });
