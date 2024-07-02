import { IStorage } from '../Storage';
import { WalletsStorage } from './walletsService';
import { isPasswordAuthWallet } from '../entries/wallet';
import { decrypt, encrypt } from './cryptoService';
import { mnemonicValidate } from '@ton/crypto';
import { decryptWalletMnemonic } from './mnemonicService';

export class PasswordStorage {
    private readonly walletStorage: WalletsStorage;

    constructor(storage: IStorage) {
        this.walletStorage = new WalletsStorage(storage);
    }

    async getIsPasswordSet() {
        const wallets = await this.getPasswordAuthWallets();
        return wallets.length > 0;
    }

    async isPasswordValid(password: string): Promise<boolean> {
        try {
            const walletToCheck = (await this.getPasswordAuthWallets())[0];
            if (!walletToCheck) {
                throw new Error('None wallet has a password auth');
            }

            const mnemonic = (await decrypt(walletToCheck.auth.encryptedMnemonic, password)).split(
                ' '
            );
            return await mnemonicValidate(mnemonic);
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async checkPassword(password: string): Promise<void> {
        const isValid = await this.isPasswordValid(password);
        if (!isValid) {
            throw new Error('Invalid password');
        }
    }

    async updatePassword(oldPassword: string, newPassword: string): Promise<void> {
        const wallets = await this.getPasswordAuthWallets();

        const updatedWallets = await Promise.all(
            wallets.map(async wallet => {
                const mnemonic = await decryptWalletMnemonic(wallet, oldPassword);
                const newEncrypted = await encrypt(mnemonic.join(' '), newPassword);
                return {
                    ...wallet,
                    auth: { ...wallet.auth, encryptedMnemonic: newEncrypted }
                };
            })
        );

        await this.walletStorage.updateWalletsInState(updatedWallets);
    }

    private async getPasswordAuthWallets() {
        const wallets = await this.walletStorage.getWallets();
        return wallets.filter(isPasswordAuthWallet);
    }
}

export const MinPasswordLength = 6;

export function validatePassword(password: string) {
    return password.length >= MinPasswordLength;
}

export const passwordStorage = (storage: IStorage): PasswordStorage => new PasswordStorage(storage);
