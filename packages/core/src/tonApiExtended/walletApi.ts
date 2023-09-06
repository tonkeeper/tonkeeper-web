import { WalletState } from '../entries/wallet';
import { Configuration, WalletApi } from '../tonApiV2';

export const getWalletActiveAddresses = async (
    tonApi: Configuration,
    wallet: WalletState
): Promise<string[]> => {
    const { accounts } = await new WalletApi(tonApi).getWalletsByPublicKey({
        publicKey: wallet.publicKey
    });
    const result = accounts
        .filter(item => item.balance > 0 || item.status === 'active')
        .map(w => w.address);

    if (result.length > 0) {
        return result;
    } else {
        return [wallet.active.rawAddress];
    }
};
