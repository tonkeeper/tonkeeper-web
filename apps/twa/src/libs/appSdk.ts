import {
    HapticFeedback,
    LaunchParams,
    MainButton,
    MiniApp,
    Utils,
    Viewport,
    initBackButton,
    initHapticFeedback,
    initMainButton,
    initMiniApp,
    initUtils,
    retrieveLaunchParams
} from '@tma.js/sdk';
import { BaseApp, NativeBackButton, NotificationService } from '@tonkeeper/core/dist/AppSdk';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { disableScroll, enableScroll, getScrollbarWidth } from './scroll';
import { TwaStorage } from './storage';
import { TwaNotification } from './twaNotification';

export class TwaAppSdk extends BaseApp {
    nativeBackButton: NativeBackButton;
    notifications: NotificationService;
    hapticFeedback: HapticFeedback;
    public miniApp: MiniApp;
    public launchParams: LaunchParams;
    public mainButton: MainButton;
    utils: Utils;

    constructor(public viewport: Viewport) {
        super(new TwaStorage());
        const [miniApp] = initMiniApp();
        this.miniApp = miniApp;
        this.hapticFeedback = initHapticFeedback();

        this.notifications = new TwaNotification(miniApp);

        const [backButton] = initBackButton();

        this.nativeBackButton = backButton;

        this.launchParams = retrieveLaunchParams();

        const [mainButton] = initMainButton();
        this.mainButton = mainButton;

        this.utils = initUtils();
    }

    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);

        this.topMessage(notification);
        this.hapticFeedback.notificationOccurred('success');
    };

    openPage = async (url: string) => {
        if (url.includes('t.me')) {
            this.utils.openTelegramLink(url);
        } else {
            this.utils.openLink(url);
        }
    };

    twaExpand = () => {
        if (!this.viewport.isExpanded) {
            this.viewport.expand();
        }
    };

    hapticNotification = (type: 'success' | 'error') => {
        this.hapticFeedback.notificationOccurred(type);
    };

    disableScroll = disableScroll;
    enableScroll = enableScroll;
    getScrollbarWidth = getScrollbarWidth;
    getKeyboardHeight = () => 0;

    isIOs = () => true;
    isStandalone = () => false;

    version = packageJson.version ?? 'Unknown';

    targetEnv = 'twa' as const;
}
