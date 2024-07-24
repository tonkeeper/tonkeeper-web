import { IStorage } from '../Storage';
import { isAccountTonMnemonic } from '../entries/wallet';
import { decrypt, encrypt } from './cryptoService';
import { mnemonicValidate } from '@ton/crypto';
import { decryptWalletMnemonic } from './mnemonicService';
import { AccountsStorage } from './accountsStorage';
import { AuthPassword } from '../entries/password';

export class PasswordStorage {
    private readonly accountsStorage: AccountsStorage;

    constructor(storage: IStorage) {
        this.accountsStorage = new AccountsStorage(storage);
    }

    async getIsPasswordSet() {
        const wallets = await this.getPasswordAuthAccounts();
        return wallets.length > 0;
    }

    async isPasswordValid(password: string): Promise<boolean> {
        try {
            const accToCheck = (await this.getPasswordAuthAccounts())[0];
            if (!accToCheck) {
                throw new Error('None wallet has a password auth');
            }

            const mnemonic = (
                await decrypt((accToCheck.auth as AuthPassword).encryptedMnemonic, password)
            ).split(' ');
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
        const accounts = await this.getPasswordAuthAccounts();

        const updatedWallets = await Promise.all(
            accounts.map(async acc => {
                const mnemonic = await decryptWalletMnemonic(
                    acc as { auth: AuthPassword },
                    oldPassword
                );
                const newEncrypted = await encrypt(mnemonic.join(' '), newPassword);
                return {
                    ...acc,
                    auth: { ...acc.auth, encryptedMnemonic: newEncrypted }
                };
            })
        );

        await this.accountsStorage.updateAccountsInState(updatedWallets);
    }

    private async getPasswordAuthAccounts() {
        const wallets = await this.accountsStorage.getAccounts();
        return wallets.filter(isAccountTonMnemonic).filter(a => a.auth.kind === 'password');
    }
}

export const MinPasswordLength = 6;

export function validatePassword(password: string) {
    return password.length >= MinPasswordLength;
}

export const passwordStorage = (storage: IStorage): PasswordStorage => new PasswordStorage(storage);
