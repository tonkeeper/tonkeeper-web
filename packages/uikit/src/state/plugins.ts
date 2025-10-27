import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useActiveAccount, useActiveApi } from './wallet';
import { WalletApi } from '@tonkeeper/core/dist/tonApiV2';

export const useWalletLegacyPlugins = () => {
    const api = useActiveApi();
    const activeAccount = useActiveAccount();
    const wallet = activeAccount.activeTonWallet;
    const isSuitableAccount = activeAccount.type === 'mnemonic' || activeAccount.type === 'mam';

    return useQuery(
        [QueryKey.legacyPlugins, isSuitableAccount, wallet.rawAddress, api],
        async () => {
            if (!isSuitableAccount) {
                return [];
            }

            const data = await new WalletApi(api.tonApiV2).getWalletInfo({
                accountId: wallet.rawAddress
            });
            return data.plugins.filter(plugin => plugin.type === 'subscription_v1');
        },
        {
            refetchInterval: data => (!!data?.length ? 30_000 : 0)
        }
    );
};
