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
        this.launchParams = retrieveLaunchParams();

        this.notifications = new TwaNotification(miniApp, this.launchParams);

        const [backButton] = initBackButton();

        this.nativeBackButton = backButton;

        const [mainButton] = initMainButton();
        this.mainButton = mainButton;

        this.utils = initUtils();
    }

    pasteFromClipboard = async () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
            try {
                return await navigator.clipboard.readText();
            } catch (e) {
                console.error('Failed to read clipboard', e);
                return '';
            }
        } else {
            return '';
        }
    };

    copyToClipboard = (value: string, notification?: string) => {
        copyToClipboard(value);

        this.topMessage(notification);
        this.hapticFeedback.notificationOccurred('success');
    };

    openPage = async (url: string) => {
        if (!url.startsWith('http')) {
            throw new Error('Invalid url');
        }
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

    hapticNotification = (type: 'success' | 'error' | 'impact_medium' | 'impact_light') => {
        if (type === 'success' || type === 'error') {
            this.hapticFeedback.notificationOccurred(type);
        }
    };

    disableScroll = disableScroll;
    enableScroll = enableScroll;
    getScrollbarWidth = getScrollbarWidth;
    getKeyboardHeight = () => 0;

    isIOs = () => true;
    isStandalone = () => true;

    version = packageJson.version ?? 'Unknown';

    targetEnv = 'twa' as const;
}
