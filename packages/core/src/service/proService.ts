import { ProState } from '../entries/pro';
import { WalletState } from '../entries/wallet';
import { AppKey } from '../Keys';
import { IStorage } from '../Storage';

export const getProState = async (storage: IStorage, wallet: WalletState): Promise<ProState> => {
    const state = await storage.get<ProState>(AppKey.PRO);
    if (!state) {
        return {
            wallet: {
                publicKey: wallet.publicKey,
                rawAddress: wallet.active.rawAddress
            },
            valid: false,
            validUntil: Date.now()
        };
    }

    return state;
};
