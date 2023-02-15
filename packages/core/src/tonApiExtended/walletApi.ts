import BigNumber from 'bignumber.js';
import { WalletState } from '../entries/wallet';
import {
  AccountApi,
  AccountRepr,
  JettonApi,
  JettonBalance,
  JettonsBalances,
  WalletApi,
} from '../tonApi';
import { Configuration } from '../tonApi/runtime';

export const getWalletActiveAddresses = async (
  tonApi: Configuration,
  wallet: WalletState
): Promise<string[]> => {
  const { wallets } = await new WalletApi(tonApi).findWalletsByPubKey({
    publicKey: wallet.publicKey,
  });
  const result = wallets
    .filter((item) => item.balance > 0 || item.status === 'active')
    .map((wallet) => wallet.address);

  if (result.length > 0) {
    return result;
  } else {
    return [wallet.active.rawAddress];
  }
};

export const getWalletActiveAccountInfo = async (
  tonApi: Configuration,
  wallet: WalletState,
  addresses?: string[]
): Promise<AccountRepr> => {
  if (!addresses) {
    addresses = await getWalletActiveAddresses(tonApi, wallet);
  }
  const { accounts } = await new AccountApi(tonApi).getBulkAccountInfo({
    addresses: addresses!,
  });

  const active = accounts.find(
    (item) => item.address.raw === wallet.active.rawAddress
  );

  if (!active) {
    return await new AccountApi(tonApi).getAccountInfo({
      account: wallet.active.rawAddress,
    });
  }

  return accounts.reduce((acc, item) => {
    if (acc !== item) {
      acc.balance = new BigNumber(acc.balance).plus(item.balance).toNumber();
    }
    return acc;
  }, active);
};

export const getActiveWalletJetton = async (
  tonApi: Configuration,
  wallet: WalletState,
  addresses?: string[]
): Promise<JettonsBalances> => {
  if (!addresses) {
    addresses = await getWalletActiveAddresses(tonApi, wallet);
  }
  const all = await Promise.all(
    addresses.map((account) =>
      new JettonApi(tonApi).getJettonsBalances({
        account,
      })
    )
  );

  const balances = all.reduce((acc, item) => {
    item.balances.forEach((jetton) => {
      const index = acc.findIndex(
        (j) => j.jettonAddress === jetton.jettonAddress
      );
      if (index == -1) {
        acc.push(jetton);
      } else {
        acc[index].balance = new BigNumber(acc[index].balance)
          .plus(jetton.balance)
          .toString();
      }
    });
    return acc;
  }, [] as JettonBalance[]);

  return { balances };
};
