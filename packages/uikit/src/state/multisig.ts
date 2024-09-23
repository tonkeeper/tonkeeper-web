import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';
import {
    AccountsApi,
    BlockchainApi,
    Multisig,
    MultisigApi,
    MultisigOrder,
    Multisigs
} from '@tonkeeper/core/dist/tonApiV2';
import { useAccountsState, useActiveAccount } from './wallet';
import { isStandardTonWallet, WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { orderStatus } from '@tonkeeper/core/dist/service/multisig/multisigService';
import { useRef } from 'react';
import { useCountdown } from '../hooks/useCountDown';
import {
    AccountId,
    AccountsState,
    AccountTonMultisig,
    getAccountByWalletById
} from '@tonkeeper/core/dist/entries/account';
import { useAccountsStorage } from '../hooks/useStorage';
import { useAppSdk } from '../hooks/appSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { Cell, Dictionary } from '@ton/core';

export const useMultisigWalletInfo = (walletAddressRaw: string) => {
    const { api } = useAppContext();
    return useQuery([QueryKey.multisigWallet, walletAddressRaw], async () => {
        const multisigApi = new MultisigApi(api.tonApiV2);
        return multisigApi.getMultisigAccount({ accountId: walletAddressRaw });
    });
};

export const useActiveMultisigWalletInfo = () => {
    const account = useActiveAccount();

    if (account.type !== 'ton-multisig') {
        throw new Error('Not multisig account');
    }

    return useMultisigWalletInfo(account.id);
};

export const useCheckMultisigsSigners = () => {
    const accounts = useAccountsState();
    const { api } = useAppContext();
    const accountsStorage = useAccountsStorage();
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: [QueryKey.multisigSigners, accounts],
        queryFn: async () => {
            if (!accounts?.length) {
                return;
            }
            const multisigs = accounts.filter(a => a.type === 'ton-multisig');
            const allAddedWallets = accounts.flatMap(a => a.allTonWallets).map(w => w.rawAddress);
            const multisigApi = new MultisigApi(api.tonApiV2);
            const data = await Promise.all(
                multisigs.map(m =>
                    multisigApi.getMultisigAccount({ accountId: m.activeTonWallet.rawAddress })
                )
            );

            let needChanges = false;
            for (const multisigData of data) {
                const supposedSigners = allAddedWallets.filter(w =>
                    multisigData.signers.includes(w)
                );
                const multisigAccount = multisigs.find(
                    m => m.activeTonWallet.rawAddress === multisigData.address
                ) as AccountTonMultisig;

                const notIncludedSigners = supposedSigners.filter(
                    s => !multisigAccount.hostWallets.some(w => w.address === s)
                );

                for (const signer of notIncludedSigners) {
                    needChanges = true;
                    multisigAccount.addHostWallet(signer);
                }

                const reducedSigners = multisigAccount.hostWallets.filter(
                    w => !supposedSigners.includes(w.address)
                );

                for (const signer of reducedSigners) {
                    needChanges = true;
                    multisigAccount.removeHostWallet(signer.address);
                }
            }

            if (needChanges) {
                await accountsStorage.updateAccountsInState(multisigs);

                await queryClient.invalidateQueries(
                    anyOfKeysParts(QueryKey.account, ...multisigs.map(m => m.id))
                );
            }
        }
    });
};

export const useActiveWalletMultisigWallets = () => {
    const account = useActiveAccount();
    return useWalletMultisigWallets(account.activeTonWallet.id);
};

export type MultisigInfo = Multisig & { balance: number };

export const useWalletMultisigWallets = (walletAddressRaw: string) => {
    const { api } = useAppContext();
    return useQuery([walletAddressRaw, QueryKey.multisigWallets, api], async () => {
        let response: Multisigs;
        try {
            const accountsApi = new AccountsApi(api.tonApiV2);
            response = await accountsApi.getAccountMultisigs({ accountId: walletAddressRaw });
        } catch (e) {
            return [];
        }

        if (!response.multisigs.length) {
            return [];
        }

        try {
            const contractsInfo = await new AccountsApi(api.tonApiV2).getAccounts({
                getAccountsRequest: { accountIds: response.multisigs.map(m => m.address) }
            });

            return response.multisigs.map(m => ({
                ...m,
                balance: contractsInfo.accounts.find(a => a.address === m.address)!.balance
            }));
        } catch (e) {
            return response.multisigs.map(m => ({
                ...m,
                balance: 0
            }));
        }
    });
};

export const useIsActiveAccountMultisig = () => {
    const account = useActiveAccount();
    return account.type === 'ton-multisig';
};

export const useActiveMultisigAccountHost = () => {
    const activeAccount = useActiveAccount();
    const accounts = useAccountsState();
    return getMultisigSignerInfo(accounts, activeAccount as AccountTonMultisig);
};

export const useOrderInfo = (order: MultisigOrder) => {
    const status = orderStatus(order);
    const renderTimeSeconds = useRef(Math.round(Date.now() / 1000));
    const secondsLeft = useCountdown(order.expirationDate - renderTimeSeconds.current);

    return {
        status,
        secondsLeft
    };
};

export const useOrderSignedBy = (orderAddress: string) => {
    const api = useAppContext().api;
    return useQuery([QueryKey.multisigWallet, QueryKey.multisigOrder, orderAddress], async () => {
        const result = await new BlockchainApi(api.tonApiV2).execGetMethodForBlockchainAccount({
            accountId: orderAddress,
            methodName: 'get_order_data'
        });

        const signersHex = result.stack?.[4]?.cell;
        const mask = result.stack?.[5]?.num;

        if (!signersHex || mask === undefined) {
            throw new Error('Wrong response');
        }
        const signersCell = Cell.fromBoc(Buffer.from(signersHex, 'hex'))[0];
        const signers = signersCell
            .beginParse()
            .loadDictDirect(Dictionary.Keys.Uint(8), Dictionary.Values.Address())
            .values();

        const bitArray = Number(mask).toString(2).split('');
        return signers
            .filter((_, index) => bitArray[bitArray.length - 1 - index] === '1')
            .map(a => a.toRawString());
    });
};

export function getMultisigSignerInfo(accounts: AccountsState, activeAccount: AccountTonMultisig) {
    const signerAccount = getAccountByWalletById(accounts, activeAccount.selectedHostWalletId);
    const signerWallet = signerAccount?.getTonWallet(activeAccount.selectedHostWalletId);
    if (!signerAccount || !signerWallet || !isStandardTonWallet(signerWallet)) {
        throw new Error('Signer not found');
    }

    return {
        signerAccount,
        signerWallet
    };
}

export const useMultisigTogglePinForWallet = () => {
    const client = useQueryClient();
    const storage = useAccountsStorage();
    return useMutation<void, Error, { multisigId: AccountId; hostWalletId: WalletId }>(
        async ({ multisigId, hostWalletId }) => {
            const multisig = await storage.getAccount(multisigId);
            if (!multisig || multisig.type !== 'ton-multisig') {
                throw new Error('Multisig not found');
            }

            multisig.togglePinForWallet(hostWalletId);
            await storage.updateAccountInState(multisig);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account, multisigId));
        }
    );
};

export const useMutateMultisigSelectedHostWallet = () => {
    const client = useQueryClient();
    const storage = useAccountsStorage();
    return useMutation<void, Error, { selectedWalletId: WalletId; multisigId: AccountId }>(
        async ({ multisigId, selectedWalletId }) => {
            const multisig = await storage.getAccount(multisigId);
            if (!multisig || multisig.type !== 'ton-multisig') {
                throw new Error('Multisig not found');
            }

            multisig.setSelectedHostWalletId(selectedWalletId);
            await storage.updateAccountInState(multisig);
            await client.invalidateQueries(anyOfKeysParts(QueryKey.account, multisigId));
        }
    );
};

type ViewedMultisigOrders = {
    [multisigAddress: string]: string[];
};

export const useUnviewedAccountOrdersNumber = () => {
    const { data: multisigInfo } = useActiveMultisigWalletInfo();
    const { data: viewedOrders } = useViewedAccountOrders();

    if (!multisigInfo || !viewedOrders) {
        return undefined;
    }

    const accountViewedOrders = viewedOrders[multisigInfo.address] || [];

    return multisigInfo.orders.filter(o => !accountViewedOrders.includes(o.address)).length;
};

export const useViewedAccountOrders = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    return useQuery(
        [QueryKey.viewedMultisigOrders, account.id],
        async () => {
            if (account.type !== 'ton-multisig') {
                return {};
            }
            return (
                (await sdk.storage.get<ViewedMultisigOrders>(AppKey.MULTISIG_VIEWED_ORDERS)) || {}
            );
        },
        {
            keepPreviousData: true
        }
    );
};

export const useMarkAccountOrdersAsViewed = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const account = useActiveAccount();
    return useMutation<void, Error, { orders: string[] }>(async ({ orders }) => {
        if (account.type !== 'ton-multisig') {
            throw new Error('Not multisig account');
        }
        const viewed =
            (await sdk.storage.get<ViewedMultisigOrders>(AppKey.MULTISIG_VIEWED_ORDERS)) || {};
        const currentAccountViews = viewed[account.id] || [];

        const unviewed = orders.filter(o => !currentAccountViews.includes(o));

        if (!unviewed.length) {
            return;
        }

        currentAccountViews.push(...unviewed);
        await sdk.storage.set(AppKey.MULTISIG_VIEWED_ORDERS, {
            ...viewed,
            [account.id]: currentAccountViews
        });
        await client.invalidateQueries([QueryKey.viewedMultisigOrders]);
    });
};
