import { IKeychainService, BiometryService } from '@tonkeeper/core/dist/AppSdk';
import { SecureStorage } from './plugins';
import { promptMobileProPinController } from '@tonkeeper/uikit/dist/components/modals/PromptMobileProPin';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import i18next from '../app/i18n';
import { BaseKeychainService } from '@tonkeeper/core/dist/base-keychain-service';
import { CAPACITOR_APPLICATION_ID } from './aplication-id';
import { promptDesktopPasswordController } from '@tonkeeper/uikit/dist/components/modals/PromptDesktopPassword';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';

export class KeychainCapacitor extends BaseKeychainService implements IKeychainService {
    constructor(private biometryService: BiometryService, storage: IStorage) {
        super(storage);
    }

    setData = async (key: string, value: string) => {
        await SecureStorage.storeData({
            id: `Wallet-${key}`,
            data: value
        });
    };

    getData = async (key: string) => {
        await this.securityCheck();
        const { data } = await SecureStorage.getData({
            id: `Wallet-${key}`
        });
        return data!;
    };

    removeData = async (key: string) => {
        await SecureStorage.removeData({
            id: `Wallet-${key}`
        });
    };

    clearStorage = async () => {
        await SecureStorage.clearStorage();
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
}
