import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TonKeychainRoot } from '@ton-keychain/core';
import {
    Account,
    AccountId,
    AccountMAM,
    AccountSecretMnemonic,
    AccountSecretSK,
    AccountsState,
    AccountTonMnemonic,
    AccountTonMultisig,
    AccountTonOnly,
    AccountTonSK,
    AccountTonTestnet,
    AccountTonWatchOnly,
    getAccountByWalletById,
    getNetworkByAccount,
    getWalletById,
    isAccountTonWalletStandard,
    isAccountTronCompatible,
    isAccountVersionEditable,
    isMnemonicAndPassword
} from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { AuthKeychain, MnemonicType } from '@tonkeeper/core/dist/entries/password';
import {
    isStandardTonWallet,
    TonWalletConfig,
    TonWalletStandard,
    WalletId,
    WalletVersion
} from '@tonkeeper/core/dist/entries/wallet';
import {
    AccountConfig,
    defaultAccountConfig,
    getAccountConfig,
    getActiveWalletConfig,
    setAccountConfig,
    setActiveWalletConfig
} from '@tonkeeper/core/dist/service/wallet/configService';
import { walletContract } from '@tonkeeper/core/dist/service/wallet/contractService';
import {
    accountBySignerLink,
    createMAMAccountByMnemonic,
    createMultisigTonAccount,
    createReadOnlyTonAccountByAddress,
    createStandardTestnetAccountByMnemonic,
    createStandardTonAccountByMnemonic,
    createStandardTonAccountBySK,
    getContextApiByNetwork,
    getStandardTonWalletVersions,
    getTonWalletStandard,
    getWalletAddress,
    mamAccountToMamAccountWithTron,
    parseSignerLink,
    standardTonAccountToAccountWithTron,
    tronWalletByTonMnemonic
} from '@tonkeeper/core/dist/service/walletService';
import { Account as TonapiAccount, AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useMemo } from 'react';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useAccountsStorage } from '../hooks/useStorage';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { getAccountSecret, getPasswordByNotification, useGetActiveAccountSecret } from './mnemonic';
import {
    encryptWalletSecret,
    seeIfMnemonicValid,
    walletSecretToString
} from '@tonkeeper/core/dist/service/mnemonicService';
import { useAccountsStateQuery, useAccountsState } from './accounts';
import { useGlobalPreferences } from './global-preferences';
import { useDeleteFolder } from './folders';
import { useRemoveAccountTwoFAData } from './two-fa';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { useIsTronEnabledGlobally } from './tron/tron';
import { useNavigate } from '../hooks/router/useNavigate';
import { AppRoute } from '../libs/routes';
import { isSignerLink } from './signer';
import { useRemoveBatteryAuthToken, useRequestBatteryAuthToken } from './battery';
import { tonProofSignerByTonMnemonic } from '../hooks/accountUtils';
import { useSecurityCheck } from './password';

export { useAccountsStateQuery, useAccountsState };

export const useActiveAccountQuery = () => {
    const storage = useAccountsStorage();
    return useQuery<Account | null, Error>(
        [QueryKey.account, QueryKey.wallet],
        () => {
            return storage.getActiveAccount();
        },
        {
            keepPreviousData: true
        }
    );
};

export const useActiveAccount = () => {
    const { data } = useActiveAccountQuery();
    if (!data) {
        throw new Error('No active account');
    }

    return data;
};

export const useActiveWallet = () => {
    const account = useActiveAccount();
    return account.activeTonWallet;
};

export const useActiveStandardTonWallet = () => {
    const wallet = useActiveWallet();
    if (!isStandardTonWallet(wallet)) {
        throw new Error('Wallet is not standard');
    }
    return wallet;
};

export const useMutateActiveAccount = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, AccountId>(async accountId => {
        await storage.setActiveAccountId(accountId);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.account, accountId));
    });
};

export const useMutateActiveAccountAndWallet = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, { accountId: AccountId; walletId: WalletId }>(
        async ({ accountId, walletId }) => {
            const account = await storage.getAccount(accountId);

            if (!account) {
                throw new Error('Account not found');
            }
            account.setActiveTonWallet(walletId);
            await storage.updateAccountInState(account);
            await storage.setActiveAccountId(account.id);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account, accountId, walletId));
        }
    );
};

export const useMutateActiveTonWallet = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, WalletId>(async walletId => {
        const accounts = await storage.getAccounts();
        const account = getAccountByWalletById(accounts, walletId);

        if (!account) {
            throw new Error('Account not found');
        }
        account.setActiveTonWallet(walletId);
        await storage.updateAccountInState(account);
        await storage.setActiveAccountId(account.id);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.account, walletId));
    });
};

export const useMutateAccountActiveDerivation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, { derivationIndex: number; accountId: AccountId }>(
        async ({ accountId, derivationIndex }) => {
            const account = await storage.getAccount(accountId);

            if (!account || (account.type !== 'ledger' && account.type !== 'mam')) {
                throw new Error('Account not found');
            }

            account.setActiveDerivationIndex(derivationIndex);
            const walletId = account.activeTonWallet.id;
            await storage.updateAccountInState(account);
            await storage.setActiveAccountId(account.id);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account, walletId));
        }
    );
};

export const useAddLedgerAccountDerivation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, { derivationIndex: number; accountId: AccountId }>(
        async ({ accountId, derivationIndex }) => {
            const account = await storage.getAccount(accountId);

            if (!account || account.type !== 'ledger') {
                throw new Error('Account not found');
            }

            account.setAddedDerivationsIndexes(
                account.addedDerivationsIndexes
                    .filter(i => i !== derivationIndex)
                    .concat(derivationIndex)
            );
            await storage.updateAccountInState(account);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account));
        }
    );
};

export const useRemoveLedgerAccountDerivation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, { derivationIndex: number; accountId: AccountId }>(
        async ({ accountId, derivationIndex }) => {
            const account = await storage.getAccount(accountId);

            if (!account || account.type !== 'ledger') {
                throw new Error('Account not found');
            }

            account.setAddedDerivationsIndexes(
                account.addedDerivationsIndexes.filter(i => i !== derivationIndex)
            );
            await storage.updateAccountInState(account);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account));
        }
    );
};

export const useCreateMAMAccountDerivation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    const sdk = useAppSdk();
    const appContext = useAppContext();
    const network = useActiveTonNetwork();
    const { mutateAsync: authBattery } = useRequestBatteryAuthToken();

    return useMutation<void, Error, { accountId: AccountId }>(async ({ accountId }) => {
        const account = await storage.getAccount(accountId);
        if (!account || account.type !== 'mam') {
            throw new Error('Account not found');
        }
        const newDerivationIndex = account.lastAddedIndex + 1;

        const secret = await getAccountSecret(sdk, accountId);
        if (secret.type !== 'mnemonic') {
            throw new Error('Unexpected secret type');
        }
        const mnemonic = secret.mnemonic;

        const root = await TonKeychainRoot.fromMnemonic(mnemonic, { allowLegacyMnemonic: true });
        const tonAccount = await root.getTonAccount(newDerivationIndex);

        const tonWallet = walletContract(
            tonAccount.publicKey,
            appContext.defaultWalletVersion,
            network
        );
        const tonWallets: TonWalletStandard[] = [
            {
                id: tonWallet.address.toRawString(),
                publicKey: tonAccount.publicKey,
                version: appContext.defaultWalletVersion,
                rawAddress: tonWallet.address.toRawString()
            }
        ];

        const isTronEnabled = (await getAccountConfig(sdk, accountId)).enableTron;

        account.addDerivation({
            name: account.getNewDerivationFallbackName(),
            emoji: account.emoji,
            index: newDerivationIndex,
            tonWallets,
            activeTonWalletId: tonWallets[0].id,
            tronWallet: isTronEnabled ? await tronWalletByTonMnemonic(mnemonic) : undefined
        });

        authBattery({
            signer: tonProofSignerByTonMnemonic(tonAccount.mnemonics, 'ton'),
            wallet: tonWallets[0]
        });

        await storage.updateAccountInState(account);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.account, account.id));
    });
};

export const useHideMAMAccountDerivation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, { derivationIndex: number; accountId: AccountId }>(
        async ({ accountId, derivationIndex }) => {
            const account = await storage.getAccount(accountId);

            if (!account || account.type !== 'mam') {
                throw new Error('Account not found');
            }

            account.hideDerivation(derivationIndex);
            await storage.updateAccountInState(account);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account, account.id));
        }
    );
};

export const useEnableMAMAccountDerivation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, { derivationIndex: number; accountId: AccountId }>(
        async ({ accountId, derivationIndex }) => {
            const account = await storage.getAccount(accountId);

            if (!account || account.type !== 'mam') {
                throw new Error('Account not found');
            }

            account.enableDerivation(derivationIndex);
            await storage.updateAccountInState(account);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account, account.id));
        }
    );
};

export const useAccountState = (id: AccountId | undefined) => {
    const accounts = useAccountsState();
    return useMemo(
        () => (id !== undefined ? (accounts || []).find(w => w.id === id) : undefined),
        [accounts, id]
    );
};

export const useControllableAccountAndWalletByWalletId = (
    id: WalletId | undefined
): { account: Account | undefined; wallet: TonWalletStandard | undefined } => {
    const accounts = useAccountsState().filter(isAccountTonWalletStandard);
    return useMemo(() => {
        if (!id) {
            return {
                wallet: undefined,
                account: undefined
            };
        }
        const wallet = getWalletById(accounts, id);

        if (wallet && !isStandardTonWallet(wallet)) {
            return {
                wallet: undefined,
                account: undefined
            };
        }

        return {
            wallet,
            account: getAccountByWalletById(accounts, id)
        };
    }, [accounts, id]);
};

export const useMutateAccountsState = () => {
    const client = useQueryClient();
    const storage = useAccountsStorage();
    return useMutation<void, Error, AccountsState>(async state => {
        await storage.setAccounts(state);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useCreateAccountTonMultisig = () => {
    const sdk = useAppSdk();
    const { mutateAsync: addAccountToState } = useAddAccountToStateMutation();

    return useMutation<
        AccountTonMultisig,
        Error,
        {
            address: string;
            name?: string;
            emoji?: string;
            hostWallets: WalletId[];
            selectedHostWalletId: WalletId;
            pinToWallet?: string;
        }
    >(async ({ address, name, emoji, selectedHostWalletId, pinToWallet, hostWallets }) => {
        const valid = await seeIfValidTonAddress(address);
        if (!valid) {
            throw new Error('Address is not valid.');
        }

        const account = await createMultisigTonAccount(
            sdk.storage,
            address,
            hostWallets,
            selectedHostWalletId,
            {
                name,
                emoji,
                pinToWallet
            }
        );

        await addAccountToState(account);
        return account;
    });
};
export const useCreateAccountReadOnly = () => {
    const sdk = useAppSdk();
    const { mutateAsync: addAccountToState } = useAddAccountToStateMutation();
    const { mutateAsync: selectAccountMutation } = useMutateActiveAccount();

    return useMutation<
        AccountTonWatchOnly,
        Error,
        {
            address: string;
            name?: string;
        }
    >(async ({ address, name }) => {
        const valid = await seeIfValidTonAddress(address);
        if (!valid) {
            throw new Error('Address is not valid.');
        }

        const account = await createReadOnlyTonAccountByAddress(sdk.storage, address, { name });

        await addAccountToState(account);
        await selectAccountMutation(account.id);
        return account;
    });
};

export const useCreateAccountTestnet = () => {
    const sdk = useAppSdk();
    const context = useAppContext();
    const { mutateAsync: addAccountToState } = useAddAccountToStateMutation();
    const { mutateAsync: selectAccountMutation } = useMutateActiveAccount();

    return useMutation<
        AccountTonTestnet,
        Error,
        {
            mnemonic: string[];
            mnemonicType: MnemonicType;
            password?: string;
            versions: WalletVersion[];
            selectAccount?: boolean;
        }
    >(async ({ mnemonic, password, versions, selectAccount, mnemonicType }) => {
        const accountSecret: AccountSecretMnemonic = {
            type: 'mnemonic',
            mnemonic
        };

        const valid = await seeIfMnemonicValid(mnemonic);
        if (!valid) {
            throw new Error('Mnemonic is not valid.');
        }

        if (sdk.keychain) {
            const account = await createStandardTestnetAccountByMnemonic(
                context,
                sdk.storage,
                mnemonic,
                mnemonicType,
                {
                    auth: {
                        kind: 'keychain'
                    },
                    versions
                }
            );

            await sdk.keychain.setData(
                (account.auth as AuthKeychain).keychainStoreKey,
                walletSecretToString(accountSecret)
            );

            await addAccountToState(account);
            if (selectAccount) {
                await selectAccountMutation(account.id);
            }
            return account;
        }

        if (!password) {
            password = await getPasswordByNotification(sdk);
        }

        const account = await createStandardTestnetAccountByMnemonic(
            context,
            sdk.storage,
            mnemonic,
            mnemonicType,
            {
                auth: {
                    kind: 'password',
                    encryptedSecret: await encryptWalletSecret(accountSecret, password)
                },
                versions
            }
        );

        await addAccountToState(account);
        if (selectAccount) {
            await selectAccountMutation(account.id);
        }
        return account;
    });
};

export const useAddTronToAccount = () => {
    const getSecret = useGetActiveAccountSecret();
    const activeAccount = useActiveAccount();
    const accountsStorage = useAccountsStorage();
    const client = useQueryClient();

    const getMnemonic = async () => {
        const secret = await getSecret();
        if (secret.type !== 'mnemonic') {
            throw new Error('Unexpected secret type');
        }
        return secret.mnemonic;
    };

    return useMutation(async () => {
        if (!isAccountTronCompatible(activeAccount)) {
            throw new Error('Account is not tron compatible');
        }

        let updatedAccount: Account;
        switch (activeAccount.type) {
            case 'mnemonic':
                updatedAccount = await standardTonAccountToAccountWithTron(
                    activeAccount,
                    getMnemonic
                );
                break;
            case 'mam':
                updatedAccount = await mamAccountToMamAccountWithTron(activeAccount, getMnemonic);
                break;
            default:
                assertUnreachable(activeAccount);
        }

        await accountsStorage.updateAccountInState(updatedAccount);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.account, updatedAccount.id));
    });
};

export const useCreateAccountMnemonic = () => {
    const sdk = useAppSdk();
    const context = useAppContext();
    const { mutateAsync: addAccountToState } = useAddAccountToStateMutation();
    const { mutateAsync: selectAccountMutation } = useMutateActiveAccount();
    const isTronEnabled = useIsTronEnabledGlobally();
    const { mutateAsync: authBattery } = useRequestBatteryAuthToken();

    return useMutation<
        AccountTonMnemonic,
        Error,
        {
            mnemonic: string[];
            mnemonicType: MnemonicType;
            password?: string;
            versions: WalletVersion[];
            selectAccount?: boolean;
        }
    >(async ({ mnemonic, password, versions, selectAccount, mnemonicType }) => {
        const accountSecret: AccountSecretMnemonic = {
            type: 'mnemonic',
            mnemonic
        };
        const valid = await seeIfMnemonicValid(mnemonic);
        if (!valid) {
            throw new Error('Mnemonic is not valid.');
        }

        if (sdk.keychain) {
            const account = await createStandardTonAccountByMnemonic(
                context,
                sdk.storage,
                mnemonic,
                mnemonicType,
                {
                    auth: {
                        kind: 'keychain'
                    },
                    versions,
                    generateTronWallet: isTronEnabled
                }
            );

            await sdk.keychain.setData(
                (account.auth as AuthKeychain).keychainStoreKey,
                walletSecretToString(accountSecret)
            );

            await addAccountToState(account);
            if (selectAccount) {
                await selectAccountMutation(account.id);
            }

            authBattery({
                signer: tonProofSignerByTonMnemonic(mnemonic, mnemonicType),
                wallet: account.activeTonWallet
            });

            return account;
        }

        if (!password) {
            password = await getPasswordByNotification(sdk);
        }

        const account = await createStandardTonAccountByMnemonic(
            context,
            sdk.storage,
            mnemonic,
            mnemonicType,
            {
                auth: {
                    kind: 'password',
                    encryptedSecret: await encryptWalletSecret(accountSecret, password)
                },
                versions,
                generateTronWallet: isTronEnabled
            }
        );

        await addAccountToState(account);
        if (selectAccount) {
            await selectAccountMutation(account.id);
        }

        authBattery({
            signer: tonProofSignerByTonMnemonic(mnemonic, mnemonicType),
            wallet: account.activeTonWallet
        });

        return account;
    });
};

export const useCreateAccountTonSK = () => {
    const sdk = useAppSdk();
    const context = useAppContext();
    const { mutateAsync: addAccountToState } = useAddAccountToStateMutation();
    const { mutateAsync: selectAccountMutation } = useMutateActiveAccount();

    return useMutation<
        AccountTonSK,
        Error,
        {
            sk: string;
            password?: string;
            versions: WalletVersion[];
            selectAccount?: boolean;
        }
    >(async ({ sk, password, versions, selectAccount }) => {
        const accountSecret: AccountSecretSK = {
            type: 'sk',
            sk
        };
        if (sdk.keychain) {
            const account = await createStandardTonAccountBySK(context, sdk.storage, sk, {
                auth: {
                    kind: 'keychain'
                },
                versions
            });

            await sdk.keychain.setData(
                (account.auth as AuthKeychain).keychainStoreKey,
                walletSecretToString(accountSecret)
            );

            await addAccountToState(account);
            if (selectAccount) {
                await selectAccountMutation(account.id);
            }
            return account;
        }

        if (!password) {
            password = await getPasswordByNotification(sdk);
        }

        const encryptedSK = await encryptWalletSecret(accountSecret, password);
        const account = await createStandardTonAccountBySK(context, sdk.storage, sk, {
            auth: {
                kind: 'password',
                encryptedSecret: encryptedSK
            },
            versions
        });

        await addAccountToState(account);
        if (selectAccount) {
            await selectAccountMutation(account.id);
        }
        return account;
    });
};

export const useCreateAccountMAM = () => {
    const sdk = useAppSdk();
    const context = useAppContext();
    const { mutateAsync: addAccountToState } = useAddAccountToStateMutation();
    const { mutateAsync: selectAccountMutation } = useMutateActiveAccount();
    const isTronEnabledGlobally = useIsTronEnabledGlobally();
    const { mutateAsync: authBattery } = useRequestBatteryAuthToken();

    return useMutation<
        { account: AccountMAM; childrenMnemonics: string[][] },
        Error,
        {
            mnemonic: string[];
            selectedDerivations?: number[];
            password?: string;
            selectAccount?: boolean;
        }
    >(async ({ selectedDerivations, mnemonic, password, selectAccount }) => {
        const accountSecret: AccountSecretMnemonic = {
            type: 'mnemonic',
            mnemonic
        };

        const isTronEnabled = defaultAccountConfig.enableTron && isTronEnabledGlobally;

        const rootAccount = await TonKeychainRoot.fromMnemonic(mnemonic);
        const childrenMnemonics: string[][] = (
            await Promise.all((selectedDerivations || []).map(i => rootAccount.getTonAccount(i)))
        ).map(a => a.mnemonics);

        const authBatteryForAllChildren = async (account: AccountMAM) => {
            for (const d of account.derivations) {
                try {
                    await authBattery({
                        signer: tonProofSignerByTonMnemonic(
                            (
                                await rootAccount.getTonAccount(d.index)
                            ).mnemonics,
                            'ton'
                        ),
                        wallet: d.tonWallets[0]
                    });
                } catch (e) {
                    console.error(e);
                }
            }
        };

        if (sdk.keychain) {
            const account = await createMAMAccountByMnemonic(context, sdk.storage, mnemonic, {
                selectedDerivations,
                auth: {
                    kind: 'keychain'
                },
                generateTronWallet: isTronEnabled
            });

            await sdk.keychain.setData(
                (account.auth as AuthKeychain).keychainStoreKey,
                walletSecretToString(accountSecret)
            );

            await addAccountToState(account);
            if (selectAccount) {
                await selectAccountMutation(account.id);
            }

            authBatteryForAllChildren(account);

            return { account, childrenMnemonics };
        }

        if (!password) {
            password = await getPasswordByNotification(sdk);
        }

        const account = await createMAMAccountByMnemonic(context, sdk.storage, mnemonic, {
            selectedDerivations,
            auth: {
                kind: 'password',
                encryptedSecret: await encryptWalletSecret(accountSecret, password)
            },
            generateTronWallet: isTronEnabled
        });

        await addAccountToState(account);
        if (selectAccount) {
            await selectAccountMutation(account.id);
        }

        authBatteryForAllChildren(account);

        return { account, childrenMnemonics };
    });
};

export const useParseAndAddSigner = () => {
    const sdk = useAppSdk();
    const { mutateAsync } = useAddSignerWallet();
    return useMutation<AccountTonOnly, Error, { link: string; source: 'qr' | 'deeplink' }>(
        async ({ link, source }) => {
            try {
                if (source === 'qr' && !isSignerLink(link)) {
                    throw new Error('Unexpected QR code');
                }

                const parsed = parseSignerLink(link);
                return await mutateAsync({ ...parsed, source });
            } catch (e) {
                if (e instanceof Error) sdk.alert(e.message);
                throw e;
            }
        }
    );
};

export const useAddSignerWallet = () => {
    const sdk = useAppSdk();
    const accountsStorage = useAccountsStorage();
    const client = useQueryClient();
    const context = useAppContext();
    const navigate = useNavigate();

    return useMutation<
        AccountTonOnly,
        Error,
        { publicKey: string | null; name: string | null; source: 'qr' | 'deeplink' }
    >(async ({ publicKey, name, source }) => {
        if (publicKey === null) {
            sdk.topMessage('Missing public key');
            navigate(AppRoute.home);
            throw new Error('Missing public key');
        }

        const newAccount = await accountBySignerLink(
            context,
            Network.MAINNET,
            sdk.storage,
            publicKey,
            name,
            source === 'deeplink' ? 'signer-deeplink' : 'signer'
        );
        await accountsStorage.addAccountToState(newAccount);
        await accountsStorage.setActiveAccountId(newAccount.id);
        await client.invalidateQueries([QueryKey.account]);
        navigate(AppRoute.home);
        return newAccount;
    });
};

export const useAddTonWalletVersionToAccount = () => {
    const accountsStore = useAccountsStorage();
    const client = useQueryClient();

    return useMutation<
        TonWalletStandard,
        Error,
        {
            accountId: AccountId;
            version: WalletVersion;
        }
    >(async ({ accountId, version }) => {
        const account = (await accountsStore.getAccount(accountId))!;
        if (!isAccountVersionEditable(account)) {
            throw new Error('Cannot add wallet to this account');
        }
        const publicKey = account.activeTonWallet.publicKey;

        const network = getNetworkByAccount(account);
        const w = getWalletAddress(publicKey, version, network);
        const wallet = getTonWalletStandard(
            { rawAddress: w.address.toRawString(), version },
            publicKey,
            network
        );

        account.addTonWalletToActiveDerivation(wallet);
        await accountsStore.updateAccountInState(account);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.account, account.id, wallet.id));
        return wallet;
    });
};

export const useRemoveTonWalletVersionFromAccount = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    const sdk = useAppSdk();

    return useMutation<
        void,
        Error,
        {
            accountId: AccountId;
            walletId: WalletId;
        }
    >(async ({ walletId, accountId }) => {
        const account = (await storage.getAccount(accountId))!;
        if (!isAccountVersionEditable(account)) {
            throw new Error('Cannot add wallet to this account');
        }
        const { notifications } = sdk;
        if (notifications) {
            await Promise.all(
                account.allTonWallets.map(item =>
                    notifications.unsubscribe(item.rawAddress).catch(e => console.error(e))
                )
            );
        }
        account.removeTonWalletFromActiveDerivation(walletId);
        await storage.updateAccountInState(account);
        await client.invalidateQueries(anyOfKeysParts(QueryKey.account, account.id, walletId));
    });
};

export const useAddAccountToStateMutation = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    return useMutation<void, Error, Account>(async account => {
        await storage.addAccountToState(account);
        await client.invalidateQueries([QueryKey.account]);
    });
};

export const useMutateDeleteAll = () => {
    const sdk = useAppSdk();
    const storage = useAccountsStorage();

    return useMutation<void, Error, void>(async () => {
        try {
            const { notifications } = sdk;
            if (notifications) {
                try {
                    await notifications.unsubscribe();
                } catch (e) {
                    console.error(e);
                }
            }

            await storage.clearAccountFromState();
            await sdk.storage.clear();
            await sdk.keychain?.clearStorage();
        } finally {
            sdk.reloadApp();
        }
    });
};

export const useIsPasswordSet = () => {
    const wallets = useAccountsState();
    return (wallets || []).some(acc => isMnemonicAndPassword(acc) && acc.auth.kind === 'password');
};

export const useMutateLogOut = () => {
    const storage = useAccountsStorage();
    const client = useQueryClient();
    const { folders } = useGlobalPreferences();
    const deleteFolder = useDeleteFolder();
    const accounts = useAccountsState();
    const { mutateAsync: removeAccountTwoFA } = useRemoveAccountTwoFAData();
    const { mutateAsync: removeBatteryAuthToken } = useRemoveBatteryAuthToken();
    const sdk = useAppSdk();
    const { mutateAsync: securityCheck } = useSecurityCheck();

    return useMutation<void, Error, AccountId>(async accountId => {
        await securityCheck();
        const folder = folders.find(f => f.accounts.length === 1 && f.accounts[0] === accountId);

        if (folder) {
            await deleteFolder(folder);
        }

        const account = accounts.find(acc => acc.id === accountId)!;

        const multisigs = accounts
            .filter(
                acc =>
                    acc.type === 'ton-multisig' &&
                    (acc.hostWallets.some(hw =>
                        account.allTonWallets.some(w => w.rawAddress === hw.address)
                    ) ||
                        account.allTonWallets.some(w => w.id === acc.selectedHostWalletId))
            )
            .map(acc => acc.id);

        const newAccounts = await storage.removeAccountsFromState([accountId, ...multisigs]);

        if (newAccounts.length === 0) {
            await sdk.keychain?.resetSecuritySettings();
        }

        try {
            await sdk.keychain?.removeData(accountId);
            await removeAccountTwoFA(accountId);
            await removeBatteryAuthToken();
            await client.invalidateQueries([QueryKey.account]);
            await client.invalidateQueries([QueryKey.pro]);
            if (folder) {
                await client.invalidateQueries([QueryKey.globalPreferencesConfig]);
            }
        } finally {
            if (newAccounts.length === 0) {
                sdk.reloadApp();
            }
        }
    });
};

export const useMutateRenameAccount = <T extends Account>() => {
    const client = useQueryClient();
    const storage = useAccountsStorage();

    return useMutation<T, Error, { id: AccountId; name?: string; emoji?: string }>(async form => {
        if (form.name !== undefined && form.name.length <= 0) {
            throw new Error('Missing name');
        }

        const account = (await storage.getAccount(form.id))!;
        if (form.emoji) {
            account.emoji = form.emoji;
        }

        if (form.name) {
            account.name = form.name;
        }

        await storage.updateAccountInState(account);

        await client.invalidateQueries([QueryKey.account]);

        return account.clone() as T;
    });
};

export const useMutateRenameAccountDerivation = <T extends AccountMAM>() => {
    const { mutateAsync } = useMutateRenameAccountDerivations<T>();

    return useMutation<
        T,
        Error,
        { id: AccountId; derivationIndex: number; name?: string; emoji?: string }
    >(form => {
        return mutateAsync({
            name: form.name,
            emoji: form.emoji,
            id: form.id,
            derivationIndexes: [form.derivationIndex]
        });
    });
};

export const useMutateRenameAccountDerivations = <T extends AccountMAM>() => {
    const client = useQueryClient();
    const storage = useAccountsStorage();

    return useMutation<
        T,
        Error,
        { id: AccountId; derivationIndexes: number[]; name?: string; emoji?: string }
    >(async form => {
        if (form.name !== undefined && form.name.length <= 0) {
            throw new Error('Missing name');
        }

        const account = await storage.getAccount(form.id);
        if (!account || account.type !== 'mam') {
            throw new Error('Account not found');
        }

        const derivations = account.allAvailableDerivations.filter(d =>
            form.derivationIndexes.includes(d.index)
        )!;

        if (!derivations.length) {
            throw new Error('Derivation not found');
        }

        derivations.forEach(derivation => {
            if (form.emoji) {
                derivation.emoji = form.emoji;
            }
            if (form.name) {
                derivation.name = form.name;
            }

            account.updateDerivation(derivation);
        });

        await storage.updateAccountInState(account);

        await client.invalidateQueries([QueryKey.account]);

        return account.clone() as T;
    });
};

export const useActiveConfig = () => {
    const { mainnetConfig, testnetConfig } = useAppContext();
    const network = useActiveTonNetwork();
    return network === Network.TESTNET ? testnetConfig : mainnetConfig;
};

export const useActiveApi = () => {
    const appContext = useAppContext();
    const network = useActiveTonNetwork();
    return useMemo(() => getContextApiByNetwork(appContext, network), [appContext, network]);
};

export const useWalletAccountInfo = () => {
    const wallet = useActiveWallet();
    const network = useActiveTonNetwork();
    const api = useActiveApi();

    return useQuery<TonapiAccount, Error>([wallet.rawAddress, QueryKey.info, network], async () => {
        return new AccountsApi(api.tonApiV2).getAccount({
            accountId: wallet.rawAddress
        });
    });
};

export const useActiveTonNetwork = () => {
    const { data } = useActiveAccountQuery();
    return data ? getNetworkByAccount(data) : Network.MAINNET;
};

export const useActiveTonWalletConfig = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const network = useActiveTonNetwork();
    return useQuery<TonWalletConfig, Error>(
        [wallet.id, network, QueryKey.walletConfig],
        async () => getActiveWalletConfig(sdk, wallet.rawAddress, network),
        {
            keepPreviousData: true
        }
    );
};

export const useMutateActiveTonWalletConfig = () => {
    const wallet = useActiveWallet();
    const sdk = useAppSdk();
    const client = useQueryClient();
    const network = useActiveTonNetwork();
    return useMutation<void, Error, Partial<TonWalletConfig>>(async newConfig => {
        const config = await getActiveWalletConfig(sdk, wallet.rawAddress, network);

        await setActiveWalletConfig(sdk.storage, wallet.rawAddress, network, {
            ...config,
            ...newConfig
        });

        await client.invalidateQueries({
            predicate: q => q.queryKey.includes(QueryKey.walletConfig)
        });
    });
};

export const useActiveAccountConfig = () => {
    const account = useActiveAccount();
    const sdk = useAppSdk();
    return useQuery<AccountConfig, Error>(
        [account.id, QueryKey.accountConfig],
        async () => getAccountConfig(sdk, account.id),
        {
            keepPreviousData: true
        }
    );
};

export const useMutateActiveAccountConfig = () => {
    const { data: account } = useActiveAccountQuery();
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, Partial<AccountConfig>>(async newConfig => {
        if (!account) return;

        const config = await getAccountConfig(sdk, account.id);

        await setAccountConfig(sdk.storage, account.id, {
            ...config,
            ...newConfig
        });

        await client.invalidateQueries({
            predicate: q => q.queryKey.includes(QueryKey.accountConfig)
        });
    });
};

export const useStandardTonWalletVersions = (network: Network, publicKey?: string) => {
    const appContext = useAppContext();

    return useQuery(
        [QueryKey.walletVersions, publicKey, network],
        async () => {
            if (!publicKey) {
                return undefined;
            }

            return getStandardTonWalletVersions({
                appContext,
                publicKey,
                network,
                fiat: appContext.fiat
            });
        },
        {
            keepPreviousData: true
        }
    );
};

export const useTonWalletsBalances = (addresses: string[]) => {
    const { fiat } = useAppContext();
    const network = useActiveTonNetwork();
    const api = useActiveApi();

    return useQuery(
        [QueryKey.walletVersions, addresses, network, fiat],
        async () => {
            const groups = addresses.reduce((acc, item) => {
                const currGroup = acc[acc.length - 1];
                if (currGroup && currGroup.length < 100) {
                    currGroup.push(item);
                } else {
                    acc.push([item]);
                }

                return acc;
            }, [] as string[][]);
            const accountsApi = new AccountsApi(api.tonApiV2);
            const accounts = (
                await Promise.all(
                    groups.map(accountIds =>
                        accountsApi.getAccounts({
                            getAccountsRequest: { accountIds }
                        })
                    )
                )
            ).flatMap(r => r.accounts);

            return addresses.map((address, index) => ({
                address,
                tonBalance: accounts[index].balance
            }));
        },
        {
            keepPreviousData: true
        }
    );
};

export function useInvalidateActiveWalletQueries() {
    const account = useActiveAccount();
    const client = useQueryClient();
    return useMutation(async () => {
        const activeTonWallet = account.activeTonWallet;
        await client.invalidateQueries({
            predicate: query =>
                query.queryKey.includes(activeTonWallet.id) || query.queryKey.includes(account.id)
        });
    });
}

export function useInvalidateGlobalQueries() {
    const client = useQueryClient();
    return useMutation(async () => {
        await client.invalidateQueries(anyOfKeysParts(QueryKey.pro, QueryKey.dashboardData));
    });
}

export const useIsActiveWalletWatchOnly = () => {
    const wallet = useActiveAccount();
    return wallet.type === 'watch-only';
};
