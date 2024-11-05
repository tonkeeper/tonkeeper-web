import { UR } from '@keystonehq/keystone-sdk/dist/types/ur';
import { parseTonAccount } from '@keystonehq/keystone-sdk/dist/wallet/hdKey';
import { Address } from '@ton/core';
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import queryString from 'query-string';
import { IStorage } from '../Storage';
import {
    AccountKeystone,
    AccountLedger,
    AccountMAM,
    AccountTonMnemonic,
    AccountTonMultisig,
    AccountTonOnly,
    AccountTonWatchOnly
} from '../entries/account';
import { APIConfig } from '../entries/apis';
import { Network } from '../entries/network';
import { AuthKeychain, AuthPassword, MnemonicType } from '../entries/password';
import {
    WalletVersion,
    WalletVersions,
    sortWalletsByVersion,
    TonWalletStandard,
    DerivationItemNamed,
    WalletId
} from '../entries/wallet';
import { AccountsApi, WalletApi } from '../tonApiV2';
import { emojis } from '../utils/emojis';
import { accountsStorage } from './accountsStorage';
import { walletContract } from './wallet/contractService';
import { TonKeychainRoot, KeychainTonAccount } from '@ton-keychain/core';
import { mnemonicToKeypair } from './mnemonicService';
import { FiatCurrencies } from '../entries/fiat';

export const createMultisigTonAccount = async (
    storage: IStorage,
    address: string,
    hostWallets: WalletId[],
    selectedHostWalletId: WalletId,
    options: {
        name?: string;
        emoji?: string;
        pinToWallet?: string;
    }
) => {
    const rawAddress = Address.parse(address).toRawString();
    const { name, emoji } = await accountsStorage(storage).getNewAccountNameAndEmoji(
        rawAddress.split(':')[1]
    );

    return new AccountTonMultisig(
        rawAddress,
        options.name ?? name,
        options.emoji ?? emoji,
        {
            id: rawAddress,
            rawAddress: rawAddress
        },
        hostWallets.map(a => ({
            address: a,
            isPinned: a === options.pinToWallet
        })),
        selectedHostWalletId
    );
};

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

export const getTonWalletStandard = (
    item: { rawAddress: string; version: WalletVersion },
    publicKey: string,
    network: Network
): TonWalletStandard => {
    if (network === Network.TESTNET) {
        return {
            id: Address.parseRaw(item.rawAddress).toString({
                urlSafe: true,
                bounceable: false,
                testOnly: true
            }),
            publicKey,
            version: item.version,
            rawAddress: item.rawAddress
        };
    } else {
        return {
            id: item.rawAddress,
            publicKey,
            version: item.version,
            rawAddress: item.rawAddress
        };
    }
};

interface CreateWalletContext {
    mainnetApi: APIConfig;
    testnetApi: APIConfig;
    defaultWalletVersion: WalletVersion;
}

export const getContextApiByNetwork = (context: CreateWalletContext, network: Network) => {
    const api = network === Network.TESTNET ? context.testnetApi : context.mainnetApi;
    return [api, context.defaultWalletVersion] as const;
};

export const createStandardTonAccountByMnemonic = async (
    appContext: CreateWalletContext,
    storage: IStorage,
    mnemonic: string[],
    mnemonicType: MnemonicType,
    options: {
        versions?: WalletVersion[];
        network: Network;
        auth: AuthPassword | Omit<AuthKeychain, 'keychainStoreKey'>;
    }
) => {
    const keyPair = await mnemonicToKeypair(mnemonic, mnemonicType);

    const publicKey = keyPair.publicKey.toString('hex');

    let tonWallets: { rawAddress: string; version: WalletVersion }[] = [];
    if (options.versions) {
        tonWallets = options.versions
            .map(v => getWalletAddress(publicKey, v, options.network))
            .map(i => ({
                rawAddress: i.address.toRawString(),
                version: i.version
            }));
    } else {
        tonWallets = [await findWalletAddress(appContext, options.network, publicKey)];
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

    const wallets = tonWallets
        .slice()
        .map(item => getTonWalletStandard(item, publicKey, options.network));
    const walletIdToActivate = wallets[0].id;

    return new AccountTonMnemonic(
        options.network === Network.TESTNET ? `testnet-${publicKey}` : publicKey,
        name,
        emoji,
        walletAuth,
        walletIdToActivate,
        wallets,
        mnemonicType,
        options.network
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
    appContext: CreateWalletContext,
    network: Network,
    publicKey: string
): Promise<{ rawAddress: string; version: WalletVersion }> => {
    try {
        const [api] = getContextApiByNetwork(appContext, network);
        const result = await new WalletApi(api.tonApiV2).getWalletsByPublicKey({
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

    const contact = walletContract(
        Buffer.from(publicKey, 'hex'),
        appContext.defaultWalletVersion,
        network
    );
    return {
        rawAddress: contact.address.toRawString(),
        version: appContext.defaultWalletVersion
    };
};

export const getWalletAddress = (
    publicKey: Buffer | string,
    version: WalletVersion,
    network: Network
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
    network: Network
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
    appContext: CreateWalletContext,
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

    // TODO parse network from QR?
    const network = Network.MAINNET;

    const publicKey = pk;

    // TODO support multiple wallets versions configuration
    const active = await findWalletAddress(appContext, network, publicKey);

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
    appContext: CreateWalletContext,
    network: Network,
    storage: IStorage,
    publicKey: string,
    name: string | null
): Promise<AccountTonOnly> => {
    const active = await findWalletAddress(appContext, network, publicKey);

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

export const createMAMAccountByMnemonic = async (
    appContext: CreateWalletContext,
    storage: IStorage,
    rootMnemonic: string[],
    options: {
        selectedDerivations?: number[];
        network: Network;
        auth: AuthPassword | Omit<AuthKeychain, 'keychainStoreKey'>;
    }
) => {
    const rootAccount = await TonKeychainRoot.fromMnemonic(rootMnemonic, {
        allowLegacyMnemonic: true
    });

    let childTonWallets: {
        tonAccount: KeychainTonAccount;
        derivationIndex: number;
        shouldAdd: boolean;
    }[];
    if (options.selectedDerivations?.length) {
        childTonWallets = await gePreselectedMAMTonAccountsToImport(
            rootAccount,
            options.selectedDerivations
        );
    } else {
        childTonWallets = await getRelevantMAMTonAccountsToImport(
            rootAccount,
            appContext,
            options.network
        );

        if (!childTonWallets.length) {
            childTonWallets = await gePreselectedMAMTonAccountsToImport(rootAccount, [0]);
        }
    }

    let auth: AuthPassword | AuthKeychain;
    if (options.auth.kind === 'keychain') {
        auth = {
            kind: 'keychain',
            keychainStoreKey: rootAccount.id
        };
    } else {
        auth = options.auth;
    }

    const { name, emoji } = await accountsStorage(storage).getNewAccountNameAndEmoji(
        rootAccount.id
    );

    const namedDerivations: { item: DerivationItemNamed; shouldAdd: boolean }[] =
        childTonWallets.map(w => {
            const tonWallet = walletContract(
                w.tonAccount.publicKey,
                appContext.defaultWalletVersion,
                options.network
            );

            const tonWallets: TonWalletStandard[] = [
                getTonWalletStandard(
                    {
                        version: appContext.defaultWalletVersion,
                        rawAddress: tonWallet.address.toRawString()
                    },
                    w.tonAccount.publicKey,
                    options.network
                )
            ];

            return {
                item: {
                    name: AccountMAM.getNewDerivationFallbackName(w.derivationIndex),
                    emoji,
                    index: w.derivationIndex,
                    tonWallets,
                    activeTonWalletId: tonWallets[0].id
                },
                shouldAdd: w.shouldAdd
            };
        });

    const addedDerivationIndexes = namedDerivations.filter(d => d.shouldAdd).map(d => d.item.index);
    if (addedDerivationIndexes.length === 0) {
        throw new Error('No derivations to add');
    }

    return new AccountMAM(
        rootAccount.id,
        name,
        emoji,
        auth,
        addedDerivationIndexes[0],
        addedDerivationIndexes,
        namedDerivations.map(d => d.item),
        options.network
    );
};

export function getFallbackAccountEmoji(publicKeyOrBase64: string) {
    let index;
    if (/^[0-9A-Fa-f]+$/g.test(publicKeyOrBase64)) {
        index = Number('0x' + publicKeyOrBase64.slice(-6)) % emojis.length;
    } else {
        try {
            index = Buffer.from(publicKeyOrBase64, 'base64').readUint32BE() % emojis.length;
        } catch (_) {
            index = Buffer.from(publicKeyOrBase64).readUint32BE() % emojis.length;
        }
    }

    return emojis[index];
}

async function getRelevantMAMTonAccountsToImport(
    root: TonKeychainRoot,
    appContext: CreateWalletContext,
    network: Network
): Promise<{ tonAccount: KeychainTonAccount; derivationIndex: number; shouldAdd: boolean }[]> {
    const [api, defaultWalletVersion] = getContextApiByNetwork(appContext, network);
    const getAccountsBalances = async (tonAccounts: KeychainTonAccount[]) => {
        const addresses = tonAccounts.map(tonAccount =>
            walletContract(
                tonAccount.publicKey,
                defaultWalletVersion,
                network
            ).address.toRawString()
        );

        const response = await new AccountsApi(api.tonApiV2).getAccounts({
            getAccountsRequest: { accountIds: addresses }
        });

        return response.accounts.map(acc => acc.balance);
    };

    let accounts: {
        tonAccount: KeychainTonAccount;
        derivationIndex: number;
        shouldAdd: boolean;
    }[] = [];

    const indexesGap = 10;
    while (true) {
        const indexFrom = accounts.length ? accounts[accounts.length - 1].derivationIndex + 1 : 0;
        const accsToAdd = await Promise.all(
            [...Array(indexesGap)]
                .map((_, i) => indexFrom + i)
                .map(async derivationIndex => ({
                    tonAccount: await root.getTonAccount(derivationIndex),
                    derivationIndex,
                    shouldAdd: true
                }))
        );
        const balances = await getAccountsBalances(accsToAdd.map(i => i.tonAccount));
        if (balances.every(b => !b)) {
            const lastAccountToAdd = accounts
                .slice()
                .reverse()
                .findIndex(a => a.shouldAdd);

            if (lastAccountToAdd !== -1) {
                accounts = accounts.slice(0, accounts.length - lastAccountToAdd);
            }

            return accounts;
        } else {
            accsToAdd.forEach((acc, index) => {
                const balance = balances[index];
                if (!balance) {
                    acc.shouldAdd = false;
                }
            });
            accounts.push(...accsToAdd);
        }
    }
}

async function gePreselectedMAMTonAccountsToImport(
    root: TonKeychainRoot,
    selectedDerivations: number[]
): Promise<{ tonAccount: KeychainTonAccount; derivationIndex: number; shouldAdd: boolean }[]> {
    const maxDerivationIndex = selectedDerivations.reduce((acc, v) => Math.max(acc, v), -1);
    return Promise.all(
        [...Array(maxDerivationIndex + 1)].map(async (_, index) => ({
            tonAccount: await root.getTonAccount(index),
            derivationIndex: index,
            shouldAdd: selectedDerivations.includes(index)
        }))
    );
}

export async function getStandardTonWalletVersions({
    publicKey,
    appContext,
    network,
    fiat
}: {
    publicKey: string;
    appContext: CreateWalletContext;
    network: Network;
    fiat: FiatCurrencies;
}) {
    const versions = WalletVersions.map(v => getWalletAddress(publicKey, v, network));

    const [api] = getContextApiByNetwork(appContext, network);

    const response = await new AccountsApi(api.tonApiV2).getAccounts({
        getAccountsRequest: { accountIds: versions.map(v => v.address.toRawString()) }
    });

    const walletsJettonsBalances = await Promise.all(
        versions.map(v =>
            new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                accountId: v.address.toRawString(),
                currencies: [fiat],
                supportedExtensions: ['custom_payload']
            })
        )
    );

    return versions.map((v, index) => ({
        ...v,
        tonBalance: response.accounts[index].balance,
        hasJettons: walletsJettonsBalances[index].balances.some(
            b => b.price?.prices && Number(b.balance) > 0
        )
    }));
}

export async function getMAMAccountWalletsInfo({
    account,
    network,
    fiat,
    appContext,
    walletVersion
}: {
    account: TonKeychainRoot;
    network: Network;
    appContext: CreateWalletContext;
    fiat: FiatCurrencies;
    walletVersion: WalletVersion;
}) {
    const possibleWallets = await Promise.all(
        [...Array(5)].map((_, i) => account.getTonAccount(i))
    );

    const versions = possibleWallets.map(w =>
        getWalletAddress(w.publicKey, walletVersion, network)
    );

    const [api] = getContextApiByNetwork(appContext, network);

    const response = await new AccountsApi(api.tonApiV2).getAccounts({
        getAccountsRequest: { accountIds: versions.map(v => v.address.toRawString()) }
    });

    const walletsJettonsBalances = await Promise.all(
        versions.map(v =>
            new AccountsApi(api.tonApiV2).getAccountJettonsBalances({
                accountId: v.address.toRawString(),
                currencies: [fiat],
                supportedExtensions: ['custom_payload']
            })
        )
    );

    return versions.map((v, index) => ({
        ...v,
        tonBalance: response.accounts[index].balance,
        hasJettons: walletsJettonsBalances[index].balances.some(
            b => b.price?.prices && Number(b.balance) > 0
        )
    }));
}
