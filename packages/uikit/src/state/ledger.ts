import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    connectLedger,
    isTransportReady,
    LedgerTonTransport,
    waitLedgerTonAppReady
} from '@tonkeeper/core/dist/service/ledger/connector';
import { getLedgerAccountPathByIndex } from '@tonkeeper/core/dist/service/ledger/utils';
import { useAppContext } from '../hooks/appContext';
import { AccountsApi, Account } from '@tonkeeper/core/dist/tonApiV2';
import { Address } from '@ton/core';
import { useAppSdk } from '../hooks/appSdk';
import { useNavigate } from 'react-router-dom';
import { QueryKey } from '../libs/queryKey';
import { AppRoute } from '../libs/routes';
import { useCallback, useState } from 'react';
import { useAccountsStorage } from '../hooks/useStorage';
import { useActiveAccount } from './wallet';
import { accountByLedger } from '@tonkeeper/core/dist/service/walletService';

export type LedgerAccount = {
    accountIndex: number;
    publicKey: Buffer;
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

        const addresses = accountIds.map(account => Address.parse(account.address).toRawString());

        const response = await new AccountsApi(api.tonApiV2).getAccounts({
            getAccountsRequest: { accountIds: addresses }
        });

        return accountIds.map((acc, i) => ({
            accountIndex: i,
            publicKey: acc.publicKey,
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
    const accStorage = useAccountsStorage();

    return useMutation<void, Error, { accounts: LedgerAccount[]; name: string; emoji: string }>(
        async form => {
            try {
                const states = accountByLedger(form.accounts, form.name, form.emoji);

                await accStorage.addAccountToState(states);

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
    const wallet = useActiveAccount();
    return wallet.type === 'ledger';
};
