// eslint-disable-next-line max-classes-per-file
import { BaseApp, IAppSdk, BiometryService, CookieService } from '@tonkeeper/core/dist/AppSdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { sendBackground } from './backgroudService';
import { DesktopStorage } from './storage';
import { KeychainDesktop } from './keychain';
import { isValidUrlProtocol } from '@tonkeeper/core/dist/utils/common';

export class CookieDesktop implements CookieService {
    cleanUp = async () => {
        return sendBackground<void>({ king: 'clean-cookie' });
    };
}

export class BiometryServiceDesktop implements BiometryService {
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
    cookie = new CookieDesktop();

    biometry = new BiometryServiceDesktop();

    keychain = new KeychainDesktop(this.biometry, this.storage);

    constructor() {
        super(new DesktopStorage());
    }

    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);

        this.topMessage(notification);
    };

    openPage = async (url: string) => {
        if (!isValidUrlProtocol(url, this.authorizedOpenUrlProtocols)) {
            console.error('Unacceptable url protocol', url);
            return;
        }

        return sendBackground<void>({ king: 'open-page', url });
    };

    authorizedOpenUrlProtocols = ['http:', 'https:', 'tg:', 'mailto:'];

    version = packageJson.version ?? 'Unknown';

    targetEnv = 'desktop' as const;

    reloadApp = () => {
        // eslint-disable-next-line no-self-assign
        window.location.href = window.location.href;
    };
}
