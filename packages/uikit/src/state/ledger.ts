import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { AuthLedger } from '@tonkeeper/core/dist/entries/password';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { addWalletsWithCustomAuthState } from '@tonkeeper/core/dist/service/accountService';
import {
    LedgerTonTransport,
    connectLedger,
    isTransportReady,
    waitLedgerTonAppReady
} from '@tonkeeper/core/dist/service/ledger/connector';
import { getLedgerAccountPathByIndex } from '@tonkeeper/core/dist/service/ledger/utils';
import {
    findWalletVersion,
    walletStateFromLedger
} from '@tonkeeper/core/dist/service/walletService';
import { Account, AccountsApi, WalletApi } from '@tonkeeper/core/dist/tonApiV2';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { AppRoute } from '../libs/routes';

export type LedgerAccount = {
    accountIndex: number;
    publicKey: Buffer;
    version: WalletVersion;
} & Account;

type T = ReturnType<typeof useMutation<LedgerTonTransport, Error>>;

const _tonTransport: LedgerTonTransport | null = null;

export const useConnectLedgerMutation = (): { isDeviceConnected: boolean } & T => {
    // device might be connected, but mutation still pending if user didn't open Ton App on Ledger device
    const [_isDeviceConnected, setIsDeviceConnected] = useState<boolean>(false);
    const mutation = useMutation<LedgerTonTransport, Error>(async () => {
        setIsDeviceConnected(false);

        let transport: LedgerTonTransport;
        if (_tonTransport && isTransportReady(_tonTransport)) {
            transport = _tonTransport;
        } else {
            transport = await connectLedger();
        }

        setIsDeviceConnected(true);

        const isConnected = await waitLedgerTonAppReady(transport);
        if (!isConnected) {
            throw new Error('TON App is not opened');
        }

        return transport;
    });

    const reset = useCallback(() => {
        setIsDeviceConnected(false);
        mutation.reset();
    }, [mutation.reset]);

    return {
        ...mutation,
        reset,
        isDeviceConnected: _isDeviceConnected
    };
};

interface LedgerWallet {
    address: string;
    publicKey: Buffer;
    version: WalletVersion;
}

const getAddresses = async (
    api: APIConfig,
    accountIds: {
        address: string;
        publicKey: Buffer;
    }[]
) => {
    const list: LedgerWallet[] = [];
    for (let account of accountIds) {
        const result = await new WalletApi(api.tonApiV2).getWalletsByPublicKey({
            publicKey: account.publicKey.toString('hex')
        });

        const [activeWallet] = result.accounts
            .filter(wallet => {
                return wallet.balance > 0 || wallet.status === 'active';
            })
            .sort((one, two) => two.balance - one.balance);

        if (activeWallet) {
            list.push({
                address: Address.parse(activeWallet.address).toRawString(),
                publicKey: account.publicKey,
                version: activeWallet.interfaces?.length
                    ? findWalletVersion(activeWallet.interfaces)
                    : WalletVersion.V3R2
            });
        } else {
            list.push({
                address: Address.parse(account.address).toRawString(),
                publicKey: account.publicKey,
                version: WalletVersion.V3R2
            });
        }
    }

    return list;
};

export const useLedgerAccounts = (
    accountsNumber: number
): ReturnType<typeof useMutation<LedgerAccount[], Error, LedgerTonTransport>> => {
    const { api } = useAppContext();

    return useMutation<LedgerAccount[], Error, LedgerTonTransport>(async tonTransport => {
        const accountIds = await Promise.all(
            [...new Array(accountsNumber)].map((_, i) =>
                tonTransport.getAddress(getLedgerAccountPathByIndex(i))
            )
        );

        const addresses = await getAddresses(api, accountIds);

        const response = await new AccountsApi(api.tonApiV2).getAccounts({
            getAccountsRequest: { accountIds: addresses.map(item => item.address) }
        });

        return addresses.map((acc, i) => ({
            accountIndex: i,
            publicKey: acc.publicKey,
            version: acc.version,
            ...response.accounts.find(a =>
                Address.parse(a.address).equals(Address.parse(acc.address))
            )! // tonapi bug, should filter here
        }));
    });
};

export const useAddLedgerAccountsMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const navigate = useNavigate();
    return useMutation<void, Error, { accounts: LedgerAccount[]; name: string; emoji: string }>(
        async form => {
            try {
                let states = form.accounts.map(walletStateFromLedger);
                if (form.name) {
                    const suffix = (index: number) => (states.length > 1 ? ' ' + (index + 1) : '');
                    states = states.map((s, i) => ({
                        ...s,
                        name: form.name + suffix((s.auth as AuthLedger).accountIndex),
                        ...(i === 0 && !!form.emoji && { emoji: form.emoji })
                    }));
                }

                await addWalletsWithCustomAuthState(sdk.storage, states, { keepName: true });

                await client.invalidateQueries([QueryKey.account]);

                navigate(AppRoute.home);
            } catch (e) {
                if (e instanceof Error) sdk.alert(e.message);
                throw e;
            }
        }
    );
};

export const useIsActiveWalletLedger = () => {
    const { auth } = useWalletContext();
    return auth?.kind === 'ledger';
};
