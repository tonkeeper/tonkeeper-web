import { mnemonicValidate } from '@ton/crypto';
import { decrypt } from './cryptoService';
import { WalletState } from '../entries/wallet';
import { AuthPassword } from '../entries/password';

export const decryptWalletMnemonic = async (
    state: WalletState & { auth: AuthPassword },
    password: string
) => {
    const mnemonic = (await decrypt(state.auth.encryptedMnemonic, password)).split(' ');
    const isValid = await mnemonicValidate(mnemonic);
    if (!isValid) {
        throw new Error('Wallet mnemonic not valid');
    }

    return mnemonic;
};
