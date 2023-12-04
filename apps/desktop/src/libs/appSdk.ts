import { BaseApp, IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { sendBackground } from './backgroudService';
import { DesktopStorage } from './storage';

export class DesktopAppSdk extends BaseApp implements IAppSdk {
    constructor() {
        super(new DesktopStorage());
    }
    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);

        this.topMessage(notification);
    };
    openPage = async (url: string) => {
        sendBackground({ king: 'open-page', url });
    };

    version = packageJson.version ?? 'Unknown';

    isIOs = () => false;
    isStandalone = () => false;
}
