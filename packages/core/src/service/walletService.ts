import { UR } from '@keystonehq/keystone-sdk/dist/types/ur';
import { parseTonAccount } from '@keystonehq/keystone-sdk/dist/wallet/hdKey';
import { Address } from '@ton/core';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import queryString from 'query-string';
import { IStorage } from '../Storage';
import {
    AccountKeystone,
    AccountLedger,
    AccountTonMnemonic,
    AccountTonOnly,
    AccountTonWatchOnly
} from '../entries/account';
import { APIConfig } from '../entries/apis';
import { Network } from '../entries/network';
import { AuthKeychain, AuthPassword } from '../entries/password';
import { WalletVersion, WalletVersions, sortWalletsByVersion } from '../entries/wallet';
import { WalletApi } from '../tonApiV2';
import { emojis } from '../utils/emojis';
import { accountsStorage } from './accountsStorage';
import { walletContract } from './wallet/contractService';

export const createReadOnlyTonAccountByAddress = async (
    storage: IStorage,
    address: string,
    options: {
        name?: string;
    }
) => {
    const rawAddress = Address.parse(address).toRawString();
    const { name, emoji } = await accountsStorage(storage).getNewAccountNameAndEmoji(
        rawAddress.split(':')[1]
    );

    return new AccountTonWatchOnly(rawAddress, options.name ?? name, emoji, {
        id: rawAddress,
        rawAddress: rawAddress
    });
};

export const createStandardTonAccountByMnemonic = async (
    appContext: { api: APIConfig; defaultWalletVersion: WalletVersion },
    storage: IStorage,
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

    const { name, emoji } = await accountsStorage(storage).getNewAccountNameAndEmoji(publicKey);

    const walletIdToActivate = tonWallets.slice().sort(sortWalletsByVersion)[0].rawAddress;

    return new AccountTonMnemonic(
        publicKey,
        name,
        emoji,
        walletAuth,
        walletIdToActivate,
        tonWallets.map(w => ({
            id: w.rawAddress,
            publicKey,
            version: w.version,
            rawAddress: w.rawAddress
        }))
    );
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

export const accountBySignerQr = async (
    appContext: { api: APIConfig; defaultWalletVersion: WalletVersion },
    storage: IStorage,
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

    const { name: fallbackName, emoji } = await accountsStorage(storage).getNewAccountNameAndEmoji(
        publicKey
    );

    return new AccountTonOnly(
        publicKey,
        name || fallbackName,
        emoji,
        { kind: 'signer' },
        active.rawAddress,
        [
            {
                id: active.rawAddress,
                publicKey,
                version: active.version,
                rawAddress: active.rawAddress
            }
        ]
    );
};

export const accountBySignerDeepLink = async (
    appContext: { api: APIConfig; defaultWalletVersion: WalletVersion },
    storage: IStorage,
    publicKey: string,
    name: string | null
): Promise<AccountTonOnly> => {
    const active = await findWalletAddress(appContext, publicKey);

    const { name: fallbackName, emoji } = await accountsStorage(storage).getNewAccountNameAndEmoji(
        publicKey
    );

    return new AccountTonOnly(
        publicKey,
        name || fallbackName,
        emoji,
        { kind: 'signer-deeplink' },
        active.rawAddress,
        [
            {
                id: active.rawAddress,
                publicKey,
                version: active.version,
                rawAddress: active.rawAddress
            }
        ]
    );
};

export const accountByLedger = (
    accountId: string,
    walletsIndexesToAdd: number[],
    walletsInfo: {
        address: string;
        publicKey: Buffer;
        accountIndex: number;
        version: WalletVersion;
    }[],
    name: string,
    emoji: string
): AccountLedger => {
    return new AccountLedger(
        accountId,
        name,
        emoji,
        walletsIndexesToAdd[0],
        walletsIndexesToAdd,
        walletsInfo.map(item => ({
            index: item.accountIndex,
            activeTonWalletId: item.address,
            tonWallets: [
                {
                    id: item.address,
                    publicKey: item.publicKey.toString('hex'),
                    version: item.version,
                    rawAddress: item.address
                }
            ]
        }))
    );
};

export const accountByKeystone = async (ur: UR, storage: IStorage): Promise<AccountKeystone> => {
    const account = parseTonAccount(ur);
    const contact = WalletContractV4.create({
        workchain: 0,
        publicKey: Buffer.from(account.publicKey, 'hex')
    });

    const pathInfo =
        account.path && account.xfp ? { path: account.path, mfp: account.xfp } : undefined;

    const { name: fallbackName, emoji } = await accountsStorage(storage).getNewAccountNameAndEmoji(
        account.publicKey
    );

    return new AccountKeystone(account.publicKey, account.name || fallbackName, emoji, pathInfo, {
        id: contact.address.toRawString(),
        publicKey: account.publicKey,
        version: WalletVersion.V4R2,
        rawAddress: contact.address.toRawString()
    });
};

export function getFallbackAccountEmoji(publicKey: string) {
    const index = Number('0x' + publicKey.slice(-6)) % emojis.length;
    return emojis[index];
}
