import {
    IKeychainService,
    BiometryService,
    KeychainScope,
    KeychainSecurity
} from '@tonkeeper/core/dist/AppSdk';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import i18next from '../app/i18n';
import { sendBackground } from './backgroudService';
import { AUTHORIZATION_REQUIRED, passwordRetryDelay } from './keychainErrors';
import { promptDesktopPasswordController } from '@tonkeeper/uikit/dist/components/modals/PromptDesktopPassword';
import { BaseKeychainService } from '@tonkeeper/core/dist/base-keychain-service';
import { KeychainGetError } from '@tonkeeper/core/dist/errors/KeychainError';

interface ScopedBiometryService extends BiometryService {
    prompt: (reason: (lang: string) => string, scope?: KeychainScope) => Promise<void>;
}

export class KeychainDesktop extends BaseKeychainService implements IKeychainService {
    constructor(private biometryService: ScopedBiometryService, storage: IStorage) {
        super(storage);
    }

    setData = async (key: string, data: string) => {
        try {
            await this.withAuthorization({ operation: 'set', key }, () =>
                sendBackground<void>({ king: 'set-keychain', publicKey: key, mnemonic: data })
            );
            console.debug(`[KEYCHAIN] (success) SET key "Wallet-${key}"`);
        } catch (e) {
            console.error(`[KEYCHAIN] (ERROR) SET key "Wallet-${key}"`, e);
            throw e;
        }
    };

    getData = async (key: string) => {
        await this.securityCheck(undefined, { operation: 'get', key });
        let value: string | null = null;
        try {
            value = await sendBackground<string | null>({ king: 'get-keychain', publicKey: key });
        } catch (e) {
            console.error(`[KEYCHAIN] (ERROR) GET key "Wallet-${key}"`, e);
            throw new KeychainGetError();
        }

        if (value == null) {
            throw new KeychainGetError();
        }
        console.debug(`[KEYCHAIN] (success) GET key "Wallet-${key}"`);
        return value;
    };

    removeData = async (key: string) => {
        try {
            await this.withAuthorization({ operation: 'remove', key }, () =>
                sendBackground<void>({ king: 'remove-keychain', publicKey: key })
            );
            console.debug(`[KEYCHAIN] (success) DELETE key "Wallet-${key}"`);
        } catch (e) {
            console.error(`[KEYCHAIN] (ERROR) DELETE key "Wallet-${key}"`, e);
            throw e;
        }
    };

    clearStorage = async () => {
        try {
            await this.withAuthorization({ operation: 'clear' }, () =>
                sendBackground<void>({ king: 'clear-keychain' })
            );
            console.debug('[KEYCHAIN] (success) CLEAR all data');
        } catch (e) {
            console.error('[KEYCHAIN] (ERROR) CLEAR all data');
            throw e;
        }
        await this.resetPrefixIndex();
        await this.resetSecuritySettings();
    };

    override async resetSecuritySettings() {
        await this.withAuthorization({ operation: 'settings' }, () =>
            super.resetSecuritySettings()
        );
    }

    /**
     * The main process decides whether an operation needs a fresh check. A
     * caller that just ran `securityCheck()` for the same scope passes on the
     * first try; anyone else is prompted once here and the operation is
     * repeated.
     */
    private async withAuthorization<T>(
        scope: KeychainScope,
        operation: () => Promise<T>
    ): Promise<T> {
        try {
            return await operation();
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            if (!message.includes(AUTHORIZATION_REQUIRED)) {
                throw e;
            }
            await this.securityCheck(undefined, scope);
            return operation();
        }
    }

    protected override async loadSecurity() {
        return sendBackground<KeychainSecurity>({ king: 'keychain-settings-get' });
    }

    /**
     * After repeated wrong passwords the main process refuses checks for a
     * short while. Waiting it out here keeps a correct password entered
     * during that window from being shown as wrong.
     */
    protected override async verifyPassword(
        password: string,
        scope?: KeychainScope
    ): Promise<boolean> {
        try {
            return await sendBackground<boolean>({
                king: 'keychain-settings-check-password',
                password,
                scope
            });
        } catch (e) {
            const retryInMs = passwordRetryDelay(e);
            if (retryInMs === undefined) {
                throw e;
            }
            await new Promise(resolve => setTimeout(resolve, retryInMs));
            return this.verifyPassword(password, scope);
        }
    }

    protected override async storePassword(password: string) {
        await sendBackground<void>({ king: 'keychain-settings-set-password', password });
    }

    protected override async storeBiometry(enabled: boolean) {
        await sendBackground<void>({ king: 'keychain-settings-set-biometry', enabled });
    }

    protected override async clearSecurity() {
        await sendBackground<void>({ king: 'keychain-settings-reset' });
    }

    protected override promptPassword(callback: (pin?: string) => Promise<boolean | undefined>) {
        promptDesktopPasswordController.open({
            afterClose: callback
        });
    }

    protected override async securityCheckTouchId(scope?: KeychainScope) {
        return this.biometryService?.prompt(
            lng => i18next.t('touch_id_unlock_wallet', { lng }),
            scope
        );
    }

    protected override async setRawData(key: string, value: string) {
        await sendBackground<void>({ king: 'set-keychain', publicKey: key, mnemonic: value });
    }

    protected override async getRawData(key: string) {
        return (
            (await sendBackground<string | null>({ king: 'get-keychain', publicKey: key })) ?? null
        );
    }

    protected override async deleteRawData(key: string) {
        await sendBackground<void>({ king: 'remove-keychain', publicKey: key });
    }
}
