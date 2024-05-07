import { BaseApp, IAppSdk, KeychainPassword } from '@tonkeeper/core/dist/AppSdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { sendBackground } from './backgroudService';
import { DesktopStorage } from './storage';

export class KeychainDesktop implements KeychainPassword {
    setPassword = async (publicKey: string, mnemonic: string) => {
        return sendBackground<void>({ king: 'set-keychain', publicKey, mnemonic });
    };
    getPassword = async (publicKey: string, touchIdReason: (lang: string) => string) => {
        const touchIdSupported = await sendBackground<boolean>({ king: 'can-prompt-touch-id' });
        if (touchIdSupported) {
            const lagns = await sendBackground<string[]>({
                king: 'get-preferred-system-languages'
            });

            const lang = (lagns[0] || 'en').split('-')[0];
            await sendBackground<void>({
                king: 'prompt-touch-id',
                reason: touchIdReason(lang)
            });
        }
        return sendBackground<string>({ king: 'get-keychain', publicKey });
    };
}

export class DesktopAppSdk extends BaseApp implements IAppSdk {
    keychain = new KeychainDesktop();

    constructor() {
        super(new DesktopStorage());
    }

    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);

        this.topMessage(notification);
    };

    openPage = async (url: string) => {
        return sendBackground<void>({ king: 'open-page', url });
    };

    version = packageJson.version ?? 'Unknown';
}
