import { atom } from './entries/atom';
import { IStorage } from './Storage';
import { AppKey } from './Keys';
import { KeychainSecurity } from './AppSdk';
import { sha256 } from '@ton/crypto';

interface KeychainSettingsState {
    passwordHash?: string;
    biometryEnabled?: boolean;
}

export const hashPassword = async (password: string) => {
    const buffer = await sha256(password);
    return buffer.toString('hex');
};

export abstract class BaseKeychainService {
    security = atom<undefined | KeychainSecurity>(undefined);

    constructor(private storage: IStorage) {
        this.invalidateState();
    }

    private async invalidateState() {
        this.loadPublicState().then(res => this.security.next(res));
    }

    private async loadPublicState() {
        const state = await this.loadState();
        return {
            biometry: state?.biometryEnabled,
            password: !!state?.passwordHash
        };
    }

    protected async loadState() {
        const result = await this.storage.get<KeychainSettingsState>(AppKey.KEYCHAIN_SETTINGS);
        return result ?? {};
    }

    protected async updateState(state: KeychainSettingsState | null) {
        if (!state) {
            await this.storage.set(AppKey.KEYCHAIN_SETTINGS, {});
        } else {
            const current = await this.loadState();
            await this.storage.set(AppKey.KEYCHAIN_SETTINGS, { ...current, ...state });
        }
        await this.invalidateState();
    }

    securityCheck = async (type?: 'biometry' | 'password' | 'preferred') => {
        const state = await this.loadState();

        if (state.biometryEnabled || type === 'biometry') {
            try {
                await this.securityCheckTouchId();
                return;
            } catch (e) {
                console.error('Biometry authentication failed', e);
            }
        }

        return this.securityCheckPassword();
    };

    async checkPassword(password: string) {
        const state = await this.loadState();
        if (!state.passwordHash) {
            throw new Error('Password is not set');
        }

        const actualHash = await hashPassword(password);
        return actualHash === state.passwordHash;
    }

    async updatePassword(password: string) {
        const hash = await hashPassword(password);
        await this.updateState({ passwordHash: hash });
    }

    async setBiometry(enabled: boolean) {
        if (enabled) {
            await this.securityCheck('biometry');
        }
        await this.updateState({ biometryEnabled: enabled });
    }

    async resetSecuritySettings() {
        await this.updateState(null);
    }

    private async securityCheckPassword() {
        const state = await this.loadState();
        if (!state.passwordHash) {
            return;
        }

        return new Promise<void>((resolve, reject) => {
            this.promptPassword(async pin => {
                if (!pin) {
                    reject();
                    return false;
                }

                const pinHash = await hashPassword(pin);
                if (pinHash === state.passwordHash) {
                    resolve();
                    return true;
                } else {
                    return false;
                }
            });
        });
    }

    protected abstract securityCheckTouchId(): Promise<void>;
    protected abstract promptPassword(
        callback: (pin?: string) => Promise<boolean | undefined>
    ): void;
}
