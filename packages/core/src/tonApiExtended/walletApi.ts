import { WalletState } from '../entries/wallet';
import { Configuration, WalletsApi } from '../tonApiV2';

export const getWalletActiveAddresses = async (
    tonApi: Configuration,
    wallet: WalletState
): Promise<string[]> => {
    const { accounts } = await new WalletsApi(tonApi).getWalletsByPublicKey({
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
