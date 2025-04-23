import { IKeychainService, BiometryService } from '@tonkeeper/core/dist/AppSdk';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import i18next from '../app/i18n';
import { sendBackground } from './backgroudService';
import { promptDesktopPasswordController } from '@tonkeeper/uikit/dist/components/modals/PromptDesktopPassword';
import { BaseKeychainService } from '@tonkeeper/core/dist/base-keychain-service';

export class KeychainDesktop extends BaseKeychainService implements IKeychainService {
    constructor(private biometryService: BiometryService, storage: IStorage) {
        super(storage);
    }

    setData = async (key: string, data: string) => {
        return sendBackground<void>({ king: 'set-keychain', publicKey: key, mnemonic: data });
    };

    getData = async (key: string) => {
        await this.securityCheck();
        return sendBackground<string>({ king: 'get-keychain', publicKey: key });
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
