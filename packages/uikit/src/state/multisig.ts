import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';
import { AccountsApi, Multisig, MultisigApi, MultisigOrder } from '@tonkeeper/core/dist/tonApiV2';
import { useAccountsState, useActiveAccount } from './wallet';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { orderStatus } from '@tonkeeper/core/dist/service/multisig/multisigService';
import { useRef } from 'react';
import { useCountdown } from '../hooks/useCountDown';

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

export const useActiveMultisigSignerInfo = () => {
    const { data: multisig } = useActiveMultisigWalletInfo();

    const accounts = useAccountsState();

    if (!multisig) {
        return undefined;
    }
    for (const account of accounts) {
        const walletId = multisig.signers.find(s => account.getTonWallet(s));
        if (walletId) {
            const wallet = account.getTonWallet(walletId);
            if (wallet && isStandardTonWallet(wallet)) {
                return { account, wallet };
            }
        }
    }

    throw new Error('Signer not found');
};

export const useActiveWalletMultisigWallets = () => {
    const account = useActiveAccount();
    return useWalletMultisigWallets(account.activeTonWallet.id);
};

export type MultisigInfo = Multisig & { balance: number };

export const useWalletMultisigWallets = (walletAddressRaw: string) => {
    const { api } = useAppContext();
    return useQuery([walletAddressRaw, QueryKey.multisigWallets, api], async () => {
        const accountsApi = new AccountsApi(api.tonApiV2);
        const response = await accountsApi.getAccountMultisigs({ accountId: walletAddressRaw });

        if (!response.multisigs.length) {
            return [];
        }

        const contractsInfo = await new AccountsApi(api.tonApiV2).getAccounts({
            getAccountsRequest: { accountIds: response.multisigs.map(m => m.address) }
        });

        return response.multisigs.map(m => ({
            ...m,
            balance: contractsInfo.accounts.find(a => a.address === m.address)!.balance
        }));
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
