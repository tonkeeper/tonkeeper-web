import { useQuery } from '@tanstack/react-query';
import { TronWalletState } from '@tonkeeper/core/dist/entries/wallet';
import {
  getTronWalletState,
  importTronWallet,
} from '@tonkeeper/core/dist/service/tronService';
import {
  TronApi,
  TronBalance,
  TronBalances,
} from '@tonkeeper/core/dist/tronApi';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { getWalletPassword } from './password';

export const useTronWalletState = () => {
  const sdk = useAppSdk();
  const { tronApi } = useAppContext();
  const wallet = useWalletContext();

  return useQuery<TronWalletState, Error>(
    [wallet.publicKey, QueryKey.tron, wallet.network],
    async () => {
      if (wallet.tron) {
        return await getTronWalletState(tronApi, wallet.tron, wallet.network);
      }

      const password = await getWalletPassword(sdk, 'confirm');
      const tron = await importTronWallet(
        sdk.storage,
        tronApi,
        wallet,
        password
      );

      return await getTronWalletState(tronApi, tron, wallet.network);
    }
  );
};

export const useTronBalances = () => {
  const { tronApi } = useAppContext();
  const wallet = useWalletContext();

  return useQuery<TronBalances, Error>(
    [wallet.publicKey, QueryKey.tron],
    async () => {
      const sdk = new TronApi(tronApi);

      if (wallet.tron) {
        const { walletAddress } = await getTronWalletState(
          tronApi,
          wallet.tron,
          wallet.network
        );
        return await sdk.getWalletBalances({
          walletAddress,
        });
      } else {
        const { tokens } = await sdk.getSettings();
        return {
          balances: tokens.map((token) => ({ token, weiAmount: '0' })),
        };
      }
    }
  );
};

export const useTronBalance = (
  tron: TronWalletState,
  address: string | undefined
) => {
  const { tronApi } = useAppContext();
  const wallet = useWalletContext();

  return useQuery<TronBalance, Error>(
    [wallet.publicKey, QueryKey.tron, address],
    async () => {
      if (!address) {
        throw new Error('missing token address');
      }
      const sdk = new TronApi(tronApi);

      const { balances } = await sdk.getWalletBalances({
        walletAddress: tron.walletAddress,
      });

      const balance = balances.find((item) => item.token.address === address);
      if (!balance) {
        throw new Error('missing token balance');
      }

      return balance;
    }
  );
};
