import { UR } from '@keystonehq/keystone-sdk/dist/types/ur';
import { parseTonAccount } from '@keystonehq/keystone-sdk/dist/wallet/hdKey';
import { Address } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import queryString from 'query-string';
import { IStorage } from '../Storage';
import { APIConfig } from '../entries/apis';
import { Network } from '../entries/network';
import { AuthKeychain, AuthPassword } from '../entries/password';
import {
    Account,
    AccountId,
    AccountKeystone,
    AccountLedger,
    AccountTonMnemonic,
    AccountTonOnly,
    WalletVersion,
    WalletVersions
} from '../entries/wallet';
import { WalletApi } from '../tonApiV2';
import { walletContract } from './wallet/contractService';
import { emojis } from '../utils/emojis';
import { formatAddress } from '../utils/common';
import { accountsStorage } from './accountsStorage';

export const createStandardTonAccountByMnemonic = async (
    appContext: { api: APIConfig; defaultWalletVersion: WalletVersion },
    mnemonic: string[],
    options: {
        versions?: WalletVersion[];
        network?: Network;
        auth: AuthPassword | Omit<AuthKeychain, 'keychainStoreKey'>;
    }
) => {
    const keyPair = await mnemonicToPrivateKey(mnemonic);

    const publicKey = keyPair.publicKey.toString('hex');

    let tonWallets: { rawAddress: string; version: WalletVersion }[] = [];
    if (options.versions) {
        tonWallets = options.versions
            .map(v => getWalletAddress(publicKey, v))
            .map(i => ({
                rawAddress: i.address.toRawString(),
                version: i.version
            }));
    } else {
        tonWallets = [await findWalletAddress(appContext, publicKey)];
    }

    let walletAuth: AuthPassword | AuthKeychain;
    if (options.auth.kind === 'keychain') {
        walletAuth = {
            kind: 'keychain',
            keychainStoreKey: publicKey
        };
    } else {
        walletAuth = options.auth;
    }

    return {
        type: 'mnemonic',
        id: publicKey,
        auth: walletAuth,
        activeTonWalletId: tonWallets[0].rawAddress,
        emoji: getFallbackAccountEmoji(publicKey),
        name: getFallbackAccountName(publicKey),
        tonWallets: tonWallets.map(w => ({
            id: w.rawAddress,
            publicKey,
            version: w.version,
            rawAddress: w.rawAddress,
            name: getFallbackWalletName(w.rawAddress),
            emoji: getFallbackTonStandardWalletEmoji(publicKey, w.version)
        }))
    } satisfies AccountTonMnemonic;
};

const versionMap: Record<string, WalletVersion> = {
    wallet_v3r1: WalletVersion.V3R1,
    wallet_v3r2: WalletVersion.V3R2,
    wallet_v4r2: WalletVersion.V4R2,
    wallet_v5_beta: WalletVersion.V5_BETA,
    wallet_v5r1: WalletVersion.V5R1
};

const findWalletVersion = (interfaces?: string[]): WalletVersion => {
    if (!interfaces) {
        throw new Error('Unexpected wallet version');
    }
    for (const value of interfaces) {
        if (versionMap[value] !== undefined) {
            return versionMap[value];
        }
    }
    throw new Error('Unexpected wallet version');
};

const findWalletAddress = async (
    appContext: { api: APIConfig; defaultWalletVersion: WalletVersion },
    publicKey: string
): Promise<{ rawAddress: string; version: WalletVersion }> => {
    try {
        const result = await new WalletApi(appContext.api.tonApiV2).getWalletsByPublicKey({
            publicKey: publicKey
        });

        const [activeWallet] = result.accounts
            .filter(wallet => {
                if (wallet.interfaces?.some(value => Object.keys(versionMap).includes(value))) {
                    return wallet.balance > 0 || wallet.status === 'active';
                }
                return false;
            })
            .sort((one, two) => two.balance - one.balance);

        if (activeWallet) {
            return {
                rawAddress: activeWallet.address,
                version: findWalletVersion(activeWallet.interfaces)
            };
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
    }

    const contact = walletContract(Buffer.from(publicKey, 'hex'), appContext.defaultWalletVersion);
    return {
        rawAddress: contact.address.toRawString(),
        version: appContext.defaultWalletVersion
    };
};

export const getWalletAddress = (
    publicKey: Buffer | string,
    version: WalletVersion,
    network?: Network
): { address: Address; version: WalletVersion } => {
    if (typeof publicKey === 'string') {
        publicKey = Buffer.from(publicKey, 'hex');
    }
    const { address } = walletContract(publicKey, version, network);
    return {
        address,
        version
    };
};

export const getWalletsAddresses = (
    publicKey: Buffer | string,
    network?: Network
): Record<(typeof WalletVersions)[number], { address: Address; version: WalletVersion }> => {
    if (typeof publicKey === 'string') {
        publicKey = Buffer.from(publicKey, 'hex');
    }

    return Object.fromEntries(
        WalletVersions.map(version => [
            version,
            getWalletAddress(publicKey as Buffer, version, network)
        ])
    ) as Record<(typeof WalletVersions)[number], { address: Address; version: WalletVersion }>;
};

export const updateAccountProperty = async (
    storage: IStorage,
    accountId: AccountId,
    props: Partial<Pick<Account, 'name' | 'emoji'>>
) => {
    const wallet = (await accountsStorage(storage).getAccount(accountId))!;
    const updated: Account = {
        ...wallet,
        ...props
    };
    await accountsStorage(storage).updateAccountInState(updated);
    return updated;
};

export const accountBySignerQr = async (
    appContext: { api: APIConfig; defaultWalletVersion: WalletVersion },
    qrCode: string
): Promise<AccountTonOnly> => {
    if (!qrCode.startsWith('tonkeeper://signer')) {
        throw new Error('Unexpected QR code');
    }

    const {
        query: { pk, name }
    } = queryString.parseUrl(qrCode);

    if (typeof pk != 'string') {
        throw new Error('Unexpected QR code');
    }
    if (typeof name != 'string') {
        throw new Error('Unexpected QR code');
    }

    const publicKey = pk;

    // TODO support multiple wallets versions configuration
    const active = await findWalletAddress(appContext, publicKey);

    return {
        type: 'ton-only',
        id: publicKey,
        auth: { kind: 'signer' },
        activeTonWalletId: active.rawAddress,
        emoji: getFallbackAccountEmoji(publicKey),
        name: name || getFallbackAccountName(publicKey),
        tonWallets: [
            {
                id: active.rawAddress,
                publicKey,
                version: active.version,
                rawAddress: active.rawAddress,
                name: getFallbackWalletName(active.rawAddress),
                emoji: getFallbackTonStandardWalletEmoji(publicKey, active.version)
            }
        ]
    };
};

export const accountBySignerDeepLink = async (
    appContext: { api: APIConfig; defaultWalletVersion: WalletVersion },
    publicKey: string,
    name: string | null
): Promise<AccountTonOnly> => {
    const active = await findWalletAddress(appContext, publicKey);

    return {
        type: 'ton-only',
        id: publicKey,
        auth: { kind: 'signer' },
        activeTonWalletId: active.rawAddress,
        emoji: getFallbackAccountEmoji(publicKey),
        name: name || getFallbackAccountName(publicKey),
        tonWallets: [
            {
                id: active.rawAddress,
                publicKey,
                version: active.version,
                rawAddress: active.rawAddress,
                name: getFallbackWalletName(active.rawAddress),
                emoji: getFallbackTonStandardWalletEmoji(publicKey, active.version)
            }
        ]
    };
};

export const accountByLedger = (
    walletsInfo: {
        address: string;
        publicKey: Buffer;
        accountIndex: number;
    }[],
    name: string,
    emoji: string
): AccountLedger => {
    const zeroAccPublicKey = walletsInfo[0].publicKey.toString('hex');
    return {
        type: 'ledger',
        id: zeroAccPublicKey,
        emoji,
        name,
        activeDerivationIndex: walletsInfo[0].accountIndex,
        derivations: walletsInfo.map(item => ({
            index: item.accountIndex,
            name: getFallbackWalletName(item.address),
            emoji: getFallbackDerivationItemEmoji(
                item.publicKey.toString('hex'),
                item.accountIndex
            ),
            activeTonWalletId: item.address,
            tonWallets: [
                {
                    id: item.address,
                    publicKey: item.publicKey.toString('hex'),
                    version: WalletVersion.V4R2,
                    rawAddress: item.address,
                    name: getFallbackWalletName(item.address),
                    emoji: getFallbackTonStandardWalletEmoji(
                        item.publicKey.toString('hex'),
                        WalletVersion.V4R2
                    )
                }
            ]
        }))
    };
};

export const accountByKeystone = (ur: UR): AccountKeystone => {
    const account = parseTonAccount(ur);
    const contact = WalletContractV4.create({
        workchain: 0,
        publicKey: Buffer.from(account.publicKey, 'hex')
    });

    const pathInfo =
        account.path && account.xfp ? { path: account.path, mfp: account.xfp } : undefined;

    return {
        type: 'keystone',
        id: account.publicKey,
        emoji: getFallbackAccountEmoji(account.publicKey),
        name: getFallbackAccountName(account.publicKey),
        pathInfo,
        tonWallet: {
            id: contact.address.toRawString(),
            publicKey: account.publicKey,
            version: WalletVersion.V4R2,
            rawAddress: contact.address.toRawString(),
            name: getFallbackWalletName(contact.address.toRawString()),
            emoji: getFallbackTonStandardWalletEmoji(account.publicKey, WalletVersion.V4R2)
        }
    };
};

export function getFallbackAccountEmoji(publicKey: string) {
    const index = Number('0x' + publicKey.slice(-6)) % emojis.length;
    return emojis[index];
}

export function getFallbackTonStandardWalletEmoji(publicKey: string, version: WalletVersion) {
    const index = Number('0x' + publicKey.slice(-6) + version.toString()) % emojis.length;
    return emojis[index];
}

export function getFallbackDerivationItemEmoji(publicKey: string, derivationIndex: number) {
    const index =
        Number('0x' + derivationIndex.toString() + publicKey.slice(-6).toString()) % emojis.length;
    return emojis[index];
}

export function getFallbackWalletName(address: Address | string) {
    return 'Wallet ' + formatAddress(address).slice(-4);
}

export function getFallbackAccountName(id: string) {
    return 'Account ' + id.slice(0, 4);
}

export function getWalletNameAddress(address: Address | string) {
    const friendly = formatAddress(address);
    return friendly.slice(0, 4) + '…' + friendly.slice(-4);
}
