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
import { walletStateFromLedger } from '@tonkeeper/core/dist/service/walletService';
import { addWalletsWithCustomAuthState } from '@tonkeeper/core/dist/service/accountService';
import { QueryKey } from '../libs/queryKey';
import { AppRoute } from '../libs/routes';
import { useCallback, useState } from 'react';
import { AuthLedger } from '@tonkeeper/core/dist/entries/password';

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
