import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    cleanupTransport,
    connectLedger,
    LedgerTonTransport,
    waitLedgerTonAppReady
} from '@tonkeeper/core/dist/service/ledger/connector';
import { getLedgerAccountPathByIndex } from '@tonkeeper/core/dist/service/ledger/utils';
import { AccountsApi, Account } from '@tonkeeper/core/dist/tonApiV2';
import { Address } from '@ton/core';
import { useAppSdk, useAppTargetEnv } from '../hooks/appSdk';
import { useNavigate } from '../hooks/router/useNavigate';
import { QueryKey } from '../libs/queryKey';
import { AppRoute } from '../libs/routes';
import { useCallback, useEffect, useState } from 'react';
import { useAccountsStorage } from '../hooks/useStorage';
import { useActiveAccount, useActiveApi } from './wallet';
import { accountByLedger } from '@tonkeeper/core/dist/service/walletService';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { useAtomValue } from '../libs/useAtom';
import { usePrevious } from '../hooks/usePrevious';
import { atom } from '@tonkeeper/core/dist/entries/atom';

export type LedgerAccount = {
    accountIndex: number;
    publicKey: Buffer;
    version: WalletVersion;
} & Account;

type T = ReturnType<
    typeof useMutation<LedgerTonTransport, Error, { skipOpenConnectionPage?: boolean } | void>
>;

let _tonTransport: LedgerTonTransport | null = null;

export const useLedgerConnectionType = () => {
    const env = useAppTargetEnv();
    return env === 'mobile' || env === 'tablet' ? 'bluetooth' : 'wire';
};

const emptyAtom = atom<boolean>(false);
export const useLedgerConnectionPageOpened = () => {
    const sdk = useAppSdk();
    return useAtomValue(sdk.ledgerConnectionPage?.isOpened ?? emptyAtom);
};

export const useEffectOnLedgerConnectionPageClosed = (callback: () => void) => {
    const connectionPageOpened = useLedgerConnectionPageOpened();
    const prevConnectionPageOpened = usePrevious(connectionPageOpened);

    useEffect(() => {
        if (prevConnectionPageOpened && !connectionPageOpened) {
            callback();
        }
    }, [connectionPageOpened, prevConnectionPageOpened, callback]);
};

export const useConnectLedgerMutation = (): { isDeviceConnected: boolean } & T => {
    // device might be connected, but mutation still pending if user didn't open Ton App on Ledger device
    const [_isDeviceConnected, setIsDeviceConnected] = useState<boolean>(false);
    const sdk = useAppSdk();

    const connectionType = useLedgerConnectionType();
    const mutation = useMutation<
        LedgerTonTransport,
        Error,
        { skipOpenConnectionPage?: boolean } | void
    >(async options => {
        setIsDeviceConnected(false);

        if (_tonTransport) {
            try {
                await cleanupTransport(_tonTransport.transport);
                _tonTransport = null;
            } catch (e) {
                console.error(e);
            }
        }

        let transport: LedgerTonTransport;
        try {
            transport = await connectLedger(connectionType);
        } catch (e) {
            if (!options?.skipOpenConnectionPage) {
                sdk.ledgerConnectionPage?.open();
            }
            console.error(e);
            throw e;
        }

        setIsDeviceConnected(true);

        const isConnected = await waitLedgerTonAppReady(transport);
        if (!isConnected) {
            throw new Error('TON App is not opened');
        }

        _tonTransport = transport;
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

export const useLedgerWallets = (
    walletsNumber: number
): ReturnType<
    typeof useMutation<
        {
            wallets: LedgerAccount[];
            accountId: string;
            name: string;
            emoji: string;
            preselectedIndexes: Record<number, boolean>;
        },
        Error,
        LedgerTonTransport
    >
> => {
    const api = useActiveApi();
    const accountsStorage = useAccountsStorage();

    return useMutation<
        {
            wallets: LedgerAccount[];
            accountId: string;
            name: string;
            emoji: string;
            preselectedIndexes: Record<number, boolean>;
        },
        Error,
        LedgerTonTransport
    >(async tonTransport => {
        const walletsIds = await Promise.all(
            [...new Array(walletsNumber)].map((_, i) =>
                tonTransport.getAddress(getLedgerAccountPathByIndex(i), { walletVersion: 'v4' })
            )
        );

        const addresses = walletsIds.map(account => Address.parse(account.address).toRawString());

        const response = await new AccountsApi(api.tonApiV2).getAccounts({
            getAccountsRequest: { accountIds: addresses }
        });

        const accountId = walletsIds[0].publicKey.toString('hex');
        const { name, emoji } = await accountsStorage.getNewAccountNameAndEmoji(accountId);
        const existingAccountWallets = (await accountsStorage.getAccounts()).flatMap(
            a => a.allTonWallets
        );

        const wallets = walletsIds.map((acc, i) => ({
            accountIndex: i,
            publicKey: acc.publicKey,
            version: WalletVersion.V4R2,
            ...response.accounts.find(a =>
                Address.parse(a.address).equals(Address.parse(acc.address))
            )! // tonapi bug, should filter here
        }));

        const preselectedIndexes: Record<number, boolean> = {};

        wallets
            .filter(
                w =>
                    w.balance > 0 ||
                    existingAccountWallets.some(
                        item => item.id === Address.parse(w.address).toRawString()
                    )
            )
            .forEach(w => (preselectedIndexes[w.accountIndex] = true));

        if (Object.keys(preselectedIndexes).length === 0) {
            preselectedIndexes[0] = true;
        }

        return {
            wallets,
            name,
            emoji,
            accountId,
            preselectedIndexes
        };
    });
};

export const useAddLedgerAccountMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const navigate = useNavigate();
    const accStorage = useAccountsStorage();

    return useMutation<
        void,
        Error,
        {
            accountId: string;
            allWallets: LedgerAccount[];
            name: string;
            emoji: string;
            walletsIndexesToAdd: number[];
        }
    >(async form => {
        try {
            const newAccount = accountByLedger(
                form.accountId,
                form.walletsIndexesToAdd,
                form.allWallets,
                form.name,
                form.emoji
            );

            await accStorage.addAccountToState(newAccount);
            await accStorage.setActiveAccountId(newAccount.id);

            // remove separately-added in legacy app version ledger wallets that should be replaced with a single account with subwallets
            await accStorage.removeAccountsFromState(
                form.allWallets
                    .filter(w => w.publicKey.toString('hex') !== newAccount.id)
                    .map(w => w.publicKey.toString('hex'))
            );

            await client.invalidateQueries([QueryKey.account]);

            navigate(AppRoute.home);
        } catch (e) {
            if (e instanceof Error) sdk.alert(e.message);
            throw e;
        }
    });
};

export const useIsActiveWalletLedger = () => {
    const wallet = useActiveAccount();
    return wallet.type === 'ledger';
};
