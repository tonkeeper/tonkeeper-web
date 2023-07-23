import { useQuery } from '@tanstack/react-query';
import { TronApi, TronBalances } from '@tonkeeper/core/dist/tronApi';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { QueryKey } from '../libs/queryKey';

export const useTronBalances = () => {
  const { tronApi } = useAppContext();
  const wallet = useWalletContext();

  return useQuery<TronBalances, Error>(
    [wallet.publicKey, QueryKey.tron],
    async () => {
      const sdk = new TronApi(tronApi);

      if (wallet.tron) {
        return await sdk.getWalletBalances({
          walletAddress: wallet.tron.walletAddress,
        });
      } else {
        const settings = await sdk.getSettings();
        return {
          balances: settings.tokens.map((token) => ({ token, weiAmount: '0' })),
        };
      }
    }
  );
};
