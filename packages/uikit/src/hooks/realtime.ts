import { useActiveAccountQuery, useActiveApi, useActiveTonNetwork } from '../state/wallet';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { anyOfKeysParts, QueryKey } from '../libs/queryKey';
import { useAppContext } from './appContext';
import { Network } from '@tonkeeper/core/dist/entries/network';

export const useRealtimeUpdatesInvalidation = () => {
    const { data: activeAccount } = useActiveAccountQuery();
    const activeTonWallet = activeAccount?.activeTonWallet;

    const client = useQueryClient();
    const api = useActiveApi();
    const { mainnetConfig, testnetConfig } = useAppContext();
    const network = useActiveTonNetwork();

    const apiKey = useMemo(() => {
        return network === Network.TESTNET ? testnetConfig.tonApiV2Key : mainnetConfig.tonApiV2Key;
    }, [network, mainnetConfig.tonApiV2Key, testnetConfig.tonApiV2Key]);

    const apiPath = `${api.tonApiV2.basePath}/v2/sse/accounts/transactions`;

    useEffect(() => {
        if (!apiKey || !activeTonWallet) {
            return;
        }

        const url = new URL(apiPath);
        url.searchParams.append('accounts', activeTonWallet.rawAddress);
        url.searchParams.append('token', apiKey);

        const sse = new EventSource(url.toString());

        const invalidator = () => {
            /**
             * small-time gap to make sure tonapi refreshed the balances
             */
            setTimeout(() => {
                client.invalidateQueries(
                    anyOfKeysParts(QueryKey.wallet, QueryKey.account, activeTonWallet.rawAddress)
                );
            }, 500);
        };

        sse.onopen = () => {
            invalidator();
        };
        sse.onmessage = event => {
            const data = JSON.parse(event.data);
            if (data.account_id) {
                invalidator();
            }
        };

        return () => {
            sse.close();
        };
    }, [activeTonWallet?.rawAddress, apiPath, apiKey]);
};
