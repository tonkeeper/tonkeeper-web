import { UR } from '@keystonehq/keystone-sdk/dist/types/ur';
import { parseTonAccount } from '@keystonehq/keystone-sdk/dist/wallet/hdKey';
import { Address } from '@ton/core';
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4';
import queryString from 'query-string';
import { IStorage } from '../Storage';
import {
    AccountId,
    AccountKeystone,
    AccountLedger,
    AccountMAM,
    AccountTonMnemonic,
    AccountTonMultisig,
    AccountTonOnly,
    AccountTonTestnet,
    AccountTonWatchOnly
} from '../entries/account';
import { APIConfig } from '../entries/apis';
import { Network } from '../entries/network';
import { AuthKeychain, AuthPassword, MnemonicType } from '../entries/password';
import {
    WalletVersion,
    WalletVersions,
    TonWalletStandard,
    DerivationItemNamed,
    WalletId,
    sortWalletsByVersion
} from '../entries/wallet';
import { AccountsApi, WalletApi } from '../tonApiV2';
import { emojis } from '../utils/emojis';
import { accountsStorage } from './accountsStorage';
import { walletContract } from './wallet/contractService';
import { TonKeychainRoot, KeychainTonAccount } from '@ton-keychain/core';
import { mnemonicToKeypair } from './mnemonicService';
import { FiatCurrencies } from '../entries/fiat';
import { KeychainTrxAccountsProvider, TronAddressUtils } from '@ton-keychain/trx';
import { TronWallet } from '../entries/tron/tron-wallet';
import { ethers } from 'ethers';

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

const getWalletId = (rawAddress: string, network: Network): WalletId => {
    if (network === Network.TESTNET) {
        return Address.parseRaw(rawAddress).toString({
            urlSafe: true,
            bounceable: false,
            testOnly: true
        });
    } else {
        return rawAddress;
    }
};

export const getTonWalletStandard = (
    item: { rawAddress: string; version: WalletVersion },
    publicKey: string,
    network: Network
): TonWalletStandard => {
    return {
        id: getWalletId(item.rawAddress, network),
        publicKey,
        version: item.version,
        rawAddress: item.rawAddress,
        network
    };
};

interface CreateWalletContext {
    mainnetApi: APIConfig;
    testnetApi: APIConfig;
    defaultWalletVersion: WalletVersion;
}

export const tronWalletByTonMnemonic = async (
    mnemonic: string[],
    mnemonicType: MnemonicType = 'ton'
): Promise<TronWallet> => {
    if (mnemonicType === 'ton') {
        const tonAccount = await KeychainTonAccount.fromMnemonic(mnemonic);
        const trxProvider = KeychainTrxAccountsProvider.fromEntropy(tonAccount.entropy);
        const trxAccount = trxProvider.getAccount();

        return { id: trxAccount.address, address: trxAccount.address };
    } else {
        const node = ethers.HDNodeWallet.fromPhrase(
            mnemonic.join(' '),
            undefined,
            "m/44'/195'/0'/0"
        );
        const address = TronAddressUtils.hexToBase58(node.deriveChild(0).address);
        return {
            id: address,
            address
        };
    }
};

export const tonMnemonicToTronMnemonic = async (
    mnemonic: string[],
    mnemonicType: MnemonicType = 'ton'
): Promise<string[]> => {
    if (mnemonicType === 'ton') {
        const tonAccount = await KeychainTonAccount.fromMnemonic(mnemonic);
        const trxProvider = KeychainTrxAccountsProvider.fromEntropy(tonAccount.entropy);
        return trxProvider.mnemonics;
    } else {
        return mnemonic;
    }
};

export const getContextApiByNetwork = (context: CreateWalletContext, network: Network) => {
    const api = network === Network.TESTNET ? context.testnetApi : context.mainnetApi;
    return api;
};

const createPayloadOfStandardTonAccount = async (
    appContext: CreateWalletContext,
    storage: IStorage,
    mnemonic: string[],
    mnemonicType: MnemonicType,
    options: {
        versions?: WalletVersion[];
        auth: AuthPassword | Omit<AuthKeychain, 'keychainStoreKey'>;
    },
    network: Network
) => {
    const keyPair = await mnemonicToKeypair(mnemonic, mnemonicType);

    const publicKey = keyPair.publicKey.toString('hex');

    let tonWallets: { rawAddress: string; version: WalletVersion }[] = [];
    if (options.versions) {
        tonWallets = options.versions
            .map(v => getWalletAddress(publicKey, v, network))
            .map(i => ({
                rawAddress: i.address.toRawString(),
                version: i.version
            }));
    } else {
        tonWallets = [await findWalletAddress(appContext, network, publicKey)];
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

    const wallets = tonWallets.slice().map(item => getTonWalletStandard(item, publicKey, network));

    const walletIdToActivate = wallets.slice().sort(sortWalletsByVersion)[0].id;

    const tronWallet = await tronWalletByTonMnemonic(mnemonic, mnemonicType);

    return { name, emoji, publicKey, walletAuth, walletIdToActivate, wallets, tronWallet };
};

export const mayBeCreateAccountId = (
    network: Network,
    publicKey: string | undefined
): AccountId | undefined => {
    if (!publicKey) {
        return undefined;
    }
    return createAccountId(network, publicKey);
};

const createAccountId = (network: Network, publicKey: string): AccountId => {
    if (network === Network.TESTNET) {
        return `testnet-${publicKey}`;
    } else {
        return publicKey;
    }
};

export const createStandardTonAccountByMnemonic = async (
    appContext: CreateWalletContext,
    storage: IStorage,
    mnemonic: string[],
    mnemonicType: MnemonicType,
    options: {
        versions?: WalletVersion[];
        auth: AuthPassword | Omit<AuthKeychain, 'keychainStoreKey'>;
    }
) => {
    const { name, emoji, publicKey, walletAuth, walletIdToActivate, wallets, tronWallet } =
        await createPayloadOfStandardTonAccount(
            appContext,
            storage,
            mnemonic,
            mnemonicType,
            options,
            Network.MAINNET
        );

    return AccountTonMnemonic.create({
        id: createAccountId(Network.MAINNET, publicKey),
        name,
        emoji,
        auth: walletAuth,
        activeTonWalletId: walletIdToActivate,
        tonWallets: wallets,
        mnemonicType,
        networks: {
            tron: tronWallet
        }
    });
};

export const standardTonAccountToAccountWithTron = async (
    account: AccountTonMnemonic,
    getAccountMnemonic: () => Promise<string[]>
) => {
    const tronWallet = await tronWalletByTonMnemonic(
        await getAccountMnemonic(),
        account.mnemonicType
    );

    return new AccountTonMnemonic(
        account.id,
        account.name,
        account.emoji,
        account.auth,
        account.activeTonWalletId,
        account.tonWallets,
        account.mnemonicType,
        {
            tron: tronWallet
        }
    );
};

export const createStandardTestnetAccountByMnemonic = async (
    appContext: CreateWalletContext,
    storage: IStorage,
    mnemonic: string[],
    mnemonicType: MnemonicType,
    options: {
        versions?: WalletVersion[];
        auth: AuthPassword | Omit<AuthKeychain, 'keychainStoreKey'>;
    }
) => {
    const { name, emoji, publicKey, walletAuth, walletIdToActivate, wallets } =
        await createPayloadOfStandardTonAccount(
            appContext,
            storage,
            mnemonic,
            mnemonicType,
            options,
            Network.TESTNET
        );

    return AccountTonTestnet.create({
        id: createAccountId(Network.TESTNET, publicKey),
        name,
        emoji,
        auth: walletAuth,
        activeTonWalletId: walletIdToActivate,
        tonWallets: wallets,
        mnemonicType
    });
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
        const api = getContextApiByNetwork(appContext, network);
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
            Network.MAINNET
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

    const namedDerivations: { item: DerivationItemNamed; shouldAdd: boolean }[] = await Promise.all(
        childTonWallets.map(async w => {
            const tonWallet = walletContract(
                w.tonAccount.publicKey,
                appContext.defaultWalletVersion,
                Network.MAINNET
            );

            const tonWallets: TonWalletStandard[] = [
                getTonWalletStandard(
                    {
                        version: appContext.defaultWalletVersion,
                        rawAddress: tonWallet.address.toRawString()
                    },
                    w.tonAccount.publicKey,
                    Network.MAINNET
                )
            ];

            return {
                item: {
                    name: AccountMAM.getNewDerivationFallbackName(w.derivationIndex),
                    emoji,
                    index: w.derivationIndex,
                    tonWallets,
                    activeTonWalletId: tonWallets[0].id,
                    tronWallet: await tronWalletByTonMnemonic(w.tonAccount.mnemonics)
                },
                shouldAdd: w.shouldAdd
            };
        })
    );

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
        namedDerivations.map(d => d.item)
    );
};

export const mamAccountToMamAccountWithTron = async (
    account: AccountMAM,
    getAccountMnemonic: () => Promise<string[]>
) => {
    const rootAccount = await TonKeychainRoot.fromMnemonic(await getAccountMnemonic());

    const derivations = await Promise.all(
        account.allAvailableDerivations.map(async d => {
            const tonAccount = await rootAccount.getTonAccount(d.index);
            const tronWallet = await tronWalletByTonMnemonic(tonAccount.mnemonics);

            return {
                ...d,
                tronWallet
            };
        })
    );

    return new AccountMAM(
        account.id,
        account.name,
        account.emoji,
        account.auth,
        account.activeDerivationIndex,
        account.addedDerivationsIndexes,
        derivations
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
    const api = getContextApiByNetwork(appContext, network);
    const getAccountsBalances = async (tonAccounts: KeychainTonAccount[]) => {
        const addresses = tonAccounts.map(tonAccount =>
            walletContract(
                tonAccount.publicKey,
                appContext.defaultWalletVersion,
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

    const api = getContextApiByNetwork(appContext, network);

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
        id: getWalletId(v.address.toRawString(), network),
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

    const api = getContextApiByNetwork(appContext, network);

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
