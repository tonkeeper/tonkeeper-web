import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';
import {
    AccountsApi,
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

export const useMultisigWalletInfo = (walletAddressRaw: string) => {
    const { api } = useAppContext();
    return useQuery([QueryKey.multisigWallet, walletAddressRaw, api], async () => {
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

export const useOrderInfo = (order: MultisigOrder) => {
    const status = orderStatus(order);
    const signed = order.approvalsNum;
    const total = order.threshold;
    const renderTimeSeconds = useRef(Math.round(Date.now() / 1000));
    const secondsLeft = useCountdown(order.expirationDate - renderTimeSeconds.current);

    return {
        status,
        signed,
        total,
        secondsLeft
    };
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
