import { IKeychainService, BiometryService } from '@tonkeeper/core/dist/AppSdk';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import i18next from '../app/i18n';
import { sendBackground } from './backgroudService';
import { promptDesktopPasswordController } from '@tonkeeper/uikit/dist/components/modals/PromptDesktopPassword';
import { BaseKeychainService } from '@tonkeeper/core/dist/base-keychain-service';
import { KeychainGetError } from '@tonkeeper/core/dist/errors/KeychainError';

export class KeychainDesktop extends BaseKeychainService implements IKeychainService {
    constructor(private biometryService: BiometryService, storage: IStorage) {
        super(storage);
    }

    setData = async (key: string, data: string) => {
        try {
            await sendBackground<void>({ king: 'set-keychain', publicKey: key, mnemonic: data });
            console.log(`[KEYCHAIN] (success) SET key "Wallet-${key}"`);
        } catch (e) {
            console.log(`[KEYCHAIN] (ERROR) SET key "Wallet-${key}"`, e);
            throw e;
        }
    };

    getData = async (key: string) => {
        await this.securityCheck();
        let value: string | null = null;
        try {
            value = await sendBackground<string | null>({ king: 'get-keychain', publicKey: key });
        } catch (e) {
            console.log(`[KEYCHAIN] (ERROR) GET key "Wallet-${key}"`, e);
            throw new KeychainGetError();
        }

        if (value == null) {
            throw new KeychainGetError();
        }
        console.log(`[KEYCHAIN] (success) GET key "Wallet-${key}"`);
        return value;
    };

    removeData = async (key: string) => {
        try {
            await sendBackground<void>({ king: 'remove-keychain', publicKey: key });
            console.log(`[KEYCHAIN] (success) DELETE key "Wallet-${key}"`);
        } catch (e) {
            console.log(`[KEYCHAIN] (ERROR) DELETE key "Wallet-${key}"`, e);
            throw e;
        }
    };

    clearStorage = async () => {
        try {
            await sendBackground<void>({ king: 'clear-keychain' });
            console.log('[KEYCHAIN] (success) CLEAR all data');
        } catch (e) {
            console.log('[KEYCHAIN] (ERROR) CLEAR all data');
            throw e;
        }
        await this.resetSecuritySettings();
    };

    protected override promptPassword(callback: (pin?: string) => Promise<boolean | undefined>) {
        promptDesktopPasswordController.open({
            afterClose: callback
        });
    }

    protected override async securityCheckTouchId() {
        return this.biometryService?.prompt(lng => i18next.t('touch_id_unlock_wallet', { lng }));
    }
}
