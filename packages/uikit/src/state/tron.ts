import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { importTronWallet } from '@tonkeeper/core/dist/service/tronService';
import { TronApi, TronBalances } from '@tonkeeper/core/dist/tronApi';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { getWalletPassword } from './password';

export const useTronStateMigration = () => {
  const sdk = useAppSdk();
  const { tronApi } = useAppContext();
  const wallet = useWalletContext();

  const query = useQueryClient();

  return useMutation(async () => {
    const password = await getWalletPassword(sdk, 'confirm');
    const tron = await importTronWallet(sdk.storage, tronApi, wallet, password);
    console.log(tron);
    await query.cancelQueries();
  });
};

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
