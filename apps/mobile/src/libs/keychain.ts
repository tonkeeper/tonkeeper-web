import { IKeychainService, BiometryService } from '@tonkeeper/core/dist/AppSdk';
import { SecureStorage } from './plugins';
import { promptMobileProPinController } from '@tonkeeper/uikit/dist/components/modals/PromptMobileProPin';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import i18next from '../app/i18n';
import { BaseKeychainService } from '@tonkeeper/core/dist/base-keychain-service';
import { CAPACITOR_APPLICATION_ID } from './aplication-id';
import { promptDesktopPasswordController } from '@tonkeeper/uikit/dist/components/modals/PromptDesktopPassword';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { KeychainGetError } from '@tonkeeper/core/dist/errors/KeychainError';

export class KeychainCapacitor extends BaseKeychainService implements IKeychainService {
    constructor(private biometryService: BiometryService, storage: IStorage) {
        super(storage);
    }

    setData = async (key: string, value: string) => {
        try {
            await SecureStorage.storeData({
                id: `Wallet-${key}`,
                data: value
            });
            console.debug(`[KEYCHAIN] (success) SET key "Wallet-${key}"`);
        } catch (e) {
            console.error(`[KEYCHAIN] (ERROR) SET key "Wallet-${key}"`, e);
            throw e;
        }
    };

    getData = async (key: string) => {
        await this.securityCheck();
        try {
            const { data } = await SecureStorage.getData({
                id: `Wallet-${key}`
            });
            console.debug(`[KEYCHAIN] (success) GET key "Wallet-${key}"`);
            return data;
        } catch (e) {
            console.error(`[KEYCHAIN] (ERROR) GET key "Wallet-${key}"`, e);
            throw new KeychainGetError();
        }
    };

    removeData = async (key: string) => {
        try {
            await SecureStorage.removeData({
                id: `Wallet-${key}`
            });
            console.debug(`[KEYCHAIN] (success) DELETE key "Wallet-${key}"`);
        } catch (e) {
            console.error(`[KEYCHAIN] (ERROR) DELETE key "Wallet-${key}"`, e);
            throw e;
        }
    };

    clearStorage = async () => {
        try {
            await SecureStorage.clearStorage();
            console.debug('[KEYCHAIN] (success) CLEAR all data');
        } catch (e) {
            console.error('[KEYCHAIN] (ERROR) CLEAR all data');
            throw e;
        }
        await this.resetPrefixIndex();
        await this.resetSecuritySettings();
    };

    protected override async promptPassword(
        callback: (pin?: string) => Promise<boolean | undefined>
    ) {
        if (CAPACITOR_APPLICATION_ID === 'mobile') {
            return promptMobileProPinController.open({
                afterClose: callback
            });
        }

        if (CAPACITOR_APPLICATION_ID === 'tablet') {
            return promptDesktopPasswordController.open({
                afterClose: callback
            });
        }

        assertUnreachable(CAPACITOR_APPLICATION_ID);
    }

    protected override async securityCheckTouchId() {
        return this.biometryService?.prompt(lng => i18next.t('touch_id_unlock_wallet', { lng }));
    }

    protected override async setRawData(key: string, value: string) {
        await SecureStorage.storeData({ id: `Wallet-${key}`, data: value });
    }

    protected override async getRawData(key: string) {
        try {
            const { data } = await SecureStorage.getData({ id: `Wallet-${key}` });
            return data ?? null;
        } catch {
            return null;
        }
    }

    protected override async deleteRawData(key: string) {
        await SecureStorage.removeData({ id: `Wallet-${key}` });
    }
}
