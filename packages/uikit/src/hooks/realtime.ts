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
    }, [network, mainnetConfig, testnetConfig]);

    const apiPath = `${api.tonApiV2.basePath}/v2/sse/accounts/transactions`;

    useEffect(() => {
        if (!apiKey || !activeTonWallet) {
            return;
        }

        const url = new URL(apiPath);
        url.searchParams.append('accounts', activeTonWallet.rawAddress);
        url.searchParams.append('token', apiKey);

        const sse = new EventSource(url.toString());

        sse.onmessage = event => {
            const data = JSON.parse(event.data);
            if (data.account_id) {
                client.invalidateQueries(
                    anyOfKeysParts(QueryKey.wallet, QueryKey.account, activeTonWallet.id)
                );
            }
        };

        return () => {
            sse.close();
        };
    }, [activeTonWallet, apiPath, apiKey]);
};
