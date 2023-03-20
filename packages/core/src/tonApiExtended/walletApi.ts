import { WalletState } from '../entries/wallet';
import { Configuration, WalletApi } from '../tonApiV1';

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
