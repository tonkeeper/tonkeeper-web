import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    connectLedger,
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

export type LedgerAccount = {
    accountIndex: number;
    publicKey: Buffer;
} & Account;

export const useConnectLedgerMutation = (): ReturnType<
    typeof useMutation<LedgerTonTransport, Error, (() => void) | undefined>
> => {
    return useMutation<LedgerTonTransport, Error, (() => void) | undefined>(
        async onDeviceConnected => {
            const transport = await connectLedger('desktop');
            onDeviceConnected?.();

            const isConnected = await waitLedgerTonAppReady(transport);
            if (!isConnected) {
                throw new Error('TON App is not opened');
            }

            return transport;
        }
    );
};

export const useLedgerAccounts = (): ReturnType<
    typeof useMutation<LedgerAccount[], Error, LedgerTonTransport>
> => {
    const { api } = useAppContext();

    return useMutation<LedgerAccount[], Error, LedgerTonTransport>(async tonTransport => {
        const accountIds = await Promise.all(
            [...new Array(10)].map((_, i) =>
                tonTransport.getAddress(getLedgerAccountPathByIndex(i))
            )
        );

        const addresses = accountIds.map(account => Address.parse(account.address).toRawString());

        const response = await new AccountsApi(api.tonApiV2).getAccounts({
            getAccountsRequest: { accountIds: addresses }
        });

        return response.accounts.map((acc, i) => ({
            accountIndex: i,
            publicKey: accountIds[i].publicKey,
            ...acc
        }));
    });
};

export const useAddLedgerAccountsMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const navigate = useNavigate();
    return useMutation<void, Error, LedgerAccount[]>(async ledgerAccounts => {
        try {
            const states = ledgerAccounts.map(walletStateFromLedger);

            await addWalletsWithCustomAuthState(sdk.storage, states);

            await client.invalidateQueries([QueryKey.account]);

            navigate(AppRoute.home);
        } catch (e) {
            if (e instanceof Error) sdk.alert(e.message);
            throw e;
        }
    });
};
