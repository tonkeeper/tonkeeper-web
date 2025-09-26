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
            console.info(`[KEYCHAIN] (success) SET key "Wallet-${key}"`);
        } catch (e) {
            console.info(`[KEYCHAIN] (ERROR) SET key "Wallet-${key}"`, e);
            throw e;
        }
    };

    getData = async (key: string) => {
        await this.securityCheck();
        let value: string | null = null;
        try {
            value = await sendBackground<string | null>({ king: 'get-keychain', publicKey: key });
        } catch (e) {
            console.info(`[KEYCHAIN] (ERROR) GET key "Wallet-${key}"`, e);
            throw new KeychainGetError();
        }

        if (value == null) {
            throw new KeychainGetError();
        }
        console.info(`[KEYCHAIN] (success) GET key "Wallet-${key}"`);
        return value;
    };

    removeData = async (key: string) => {
        try {
            await sendBackground<void>({ king: 'remove-keychain', publicKey: key });
            console.info(`[KEYCHAIN] (success) DELETE key "Wallet-${key}"`);
        } catch (e) {
            console.info(`[KEYCHAIN] (ERROR) DELETE key "Wallet-${key}"`, e);
            throw e;
        }
    };

    clearStorage = async () => {
        try {
            await sendBackground<void>({ king: 'clear-keychain' });
            console.info('[KEYCHAIN] (success) CLEAR all data');
        } catch (e) {
            console.info('[KEYCHAIN] (ERROR) CLEAR all data');
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
