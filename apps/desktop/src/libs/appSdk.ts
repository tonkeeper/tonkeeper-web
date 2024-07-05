import { BaseApp, IAppSdk, KeychainPassword, TouchId } from '@tonkeeper/core/dist/AppSdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { sendBackground } from './backgroudService';
import { DesktopStorage } from './storage';

export class KeychainDesktop implements KeychainPassword {
    setPassword = async (publicKey: string, mnemonic: string) => {
        return sendBackground<void>({ king: 'set-keychain', publicKey, mnemonic });
    };
    getPassword = async (publicKey: string) => {
        return sendBackground<string>({ king: 'get-keychain', publicKey });
    };
}

export class TouchIdDesktop implements TouchId {
    canPrompt = async () => {
        return sendBackground<boolean>({ king: 'can-prompt-touch-id' });
    };

    prompt = async (reason: (lang: string) => string) => {
        const lagns = await sendBackground<string[]>({
            king: 'get-preferred-system-languages'
        });

        const lang = (lagns[0] || 'en').split('-')[0];
        await sendBackground<void>({
            king: 'prompt-touch-id',
            reason: reason(lang)
        });
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

    touchId = new TouchIdDesktop();

    version = packageJson.version ?? 'Unknown';

    targetEnv = 'desktop' as const;
}
