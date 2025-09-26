import { IStorage, MemoryStorage } from './Storage';
import { APIConfig } from './entries/apis';
import { BLOCKCHAIN_NAME } from './entries/crypto';
import { EventEmitter, IEventEmitter } from './entries/eventEmitter';
import { NFT } from './entries/nft';
import { FavoriteSuggestion, LatestSuggestion } from './entries/suggestion';
import { AddWalletMethod, TonContract, TonWalletStandard } from './entries/wallet';
import { KeystoneMessageType, KeystonePathInfo } from './service/keystone/types';
import { LedgerTonProofRequest, LedgerTransaction } from './service/ledger/connector';
import { TonTransferParams } from './service/deeplinkingService';
import { atom, ReadonlyAtom, ReadonlySubject, Subject } from './entries/atom';
import { BrowserTabBase, BrowserTabLive } from './service/dappBrowserService';
import { UserIdentity, UserIdentityService } from './user-identity';
import { ISubscriptionService } from './entries/pro';

export type GetPasswordType = 'confirm' | 'unlock';

export type TransferInitParams =
    | (TonTransferParams & {
          chain: BLOCKCHAIN_NAME.TON;
          from: string;
      })
    | {
          chain: BLOCKCHAIN_NAME.TRON;
          from: string;
          address?: string;
      }
    | Record<string, never>;

export type ReceiveInitParams = {
    chain?: BLOCKCHAIN_NAME;
    jetton?: string;
};

export interface KeyboardParams {
    total: number;
    viewport: number;
}
export interface UIEvents {
    unlock: void;
    copy: string;
    scan: void;
    resize: void;
    navigate: void;
    getPassword: void;
    signer: {
        boc: string;
        wallet: TonWalletStandard;
    };
    ledger:
        | { path: number[]; transactions: LedgerTransaction[] }
        | { path: number[]; tonProof: LedgerTonProofRequest };
    keystone: { message: Buffer; messageType: KeystoneMessageType; pathInfo?: KeystonePathInfo };
    loading: void;
    transfer: TransferInitParams;
    receive: ReceiveInitParams;
    nft: NFT;
    transferNft: NFT;
    keyboard: KeyboardParams;
    addSuggestion: LatestSuggestion;
    editSuggestion: FavoriteSuggestion;
    response: any;
    toast: string;
    signerTxResponse: {
        signatureHex: string;
    };
}

export interface NativeBackButton {
    on: (event: 'click', listener: () => void) => void;
    off: (event: 'click', listener: () => void) => void;
    show(): void;
    hide(): void;
}

export interface KeychainSecurity {
    biometry?: boolean;
    password?: boolean;
}

export interface IKeychainService {
    setData: (key: string, value: string) => Promise<void>;
    getData: (key: string) => Promise<string>;
    removeData: (key: string) => Promise<void>;
    clearStorage: () => Promise<void>;

    security: ReadonlyAtom<KeychainSecurity | undefined>;

    /**
     * Do an additional security check e.g. when changing settings
     * @param type
     */
    securityCheck: (type?: 'biometry' | 'password' | 'preferred') => Promise<void>;

    checkPassword: (password: string) => Promise<boolean>;
    updatePassword: (password: string) => Promise<void>;
    setBiometry: (enabled: boolean) => Promise<void>;
    resetSecuritySettings: () => Promise<void>;
}

export interface BiometryService {
    canPrompt: () => Promise<boolean>;
    prompt: (reason: (lang: string) => string) => Promise<void>;
}

export interface CookieService {
    cleanUp: () => Promise<void>;
}

export interface NotificationService {
    subscribe: (
        api: APIConfig,
        wallet: TonContract,
        signTonConnect: (bufferToSign: Buffer) => Promise<Buffer | Uint8Array>
    ) => Promise<void>;
    unsubscribe: (address?: string) => Promise<void>;

    subscribeTonConnect: (clientId: string, origin: string) => Promise<void>;
    unsubscribeTonConnect: (clientId?: string) => Promise<void>;

    subscribed: (address: string) => Promise<boolean>;
}

export interface InternetConnectionService {
    isOnline: ReadonlyAtom<boolean>;
    retry: () => Promise<boolean>;
}

export interface AppCountryInfo {
    deviceCountryCode: string | null;
    storeCountryCode: string | null;
}

export interface IAppSdk {
    storage: IStorage;
    subscriptionService: ISubscriptionService;

    nativeBackButton?: NativeBackButton;
    keychain?: IKeychainService;
    cookie?: CookieService;
    biometry?: BiometryService;

    topMessage: (text: string) => void;
    pasteFromClipboard: () => Promise<string>;
    copyToClipboard: (value: string, notification?: string) => void;
    openPage: (
        url: string,
        options?: {
            forceExternalBrowser?: boolean;
        }
    ) => Promise<unknown>;
    openNft: (nft: NFT) => void;

    disableScroll: () => void;
    enableScroll: () => void;
    getScrollbarWidth: () => number;
    getKeyboardHeight: () => number;
    isIOs: () => boolean;
    isStandalone: () => boolean;
    uiEvents: IEventEmitter<UIEvents>;
    version: string;

    confirm: (options: ConfirmOptions) => Promise<boolean>;
    alert: (text: string) => Promise<void>;
    prompt: (message: string, defaultValue?: string) => Promise<string | null>;

    requestExtensionPermission: () => Promise<void>;
    twaExpand?: () => void;
    hapticNotification: (type: 'success' | 'error' | 'impact_medium' | 'impact_light') => void;

    notifications?: NotificationService;
    targetEnv: TargetEnv;

    storeUrl?: string;
    reloadApp: () => void;
    connectionService: InternetConnectionService;

    signerReturnUrl?: string;

    keyboard: KeyboardService;

    authorizedOpenUrlProtocols: string[];

    logger?: {
        read(): Promise<string>;
        clear(): Promise<void>;
    };

    userIdentity: UserIdentity;

    dappBrowser?: IDappBrowser;

    linksInterceptorAvailable?: boolean;

    ledgerConnectionPage?: {
        isOpened: ReadonlyAtom<boolean>;
        open(): Promise<void>;
        close(): Promise<void>;
    };

    addWalletPage?: {
        getAutoMountMethod(): AddWalletMethod | null;
        open(selectedMethod?: AddWalletMethod): Promise<void>;
        close(): void;
    };

    getAppCountryInfo(): Promise<AppCountryInfo>;
}

export interface IDappBrowser {
    open(
        url: string,
        options: {
            id?: string;
            keepFocusMainView?: boolean;
        }
    ): Promise<BrowserTabBase>;
    hide(id?: string): Promise<void>;
    close(id: string | string[]): Promise<void>;
    setRequestsHandler(
        method: string,
        handler: (
            payload: unknown,
            ctx: { webViewId: string; webViewOrigin: string }
        ) => Promise<string>
    ): void;
    emitEvent(webViewId: string, payload: string): Promise<void>;

    /**
     * Emits when a tab meta is changed or a new tab is opened
     */
    tabChange: ReadonlySubject<BrowserTabLive>;
}

export interface ConfirmOptions {
    title?: string;
    message: string;
    okButtonTitle?: string;
    cancelButtonTitle?: string;
    defaultButton?: 'ok' | 'cancel';
    type?: 'none' | 'info' | 'error' | 'question' | 'warning';
}

export interface KeyboardService {
    willShow: Subject<{ keyboardHeight: number }>;
    didShow: Subject<{ keyboardHeight: number }>;
    willHide: Subject<void>;
    didHide: Subject<void>;
}

export abstract class BaseApp implements IAppSdk {
    uiEvents = new EventEmitter();

    constructor(public storage: IStorage) {
        this.userIdentity = new UserIdentityService(storage);
    }

    keychain?: IKeychainService | undefined;

    cookie?: CookieService | undefined;

    biometry?: BiometryService | undefined;

    notifications?: NotificationService | undefined;

    storeUrl?: string | undefined;

    signerReturnUrl?: string | undefined;

    logger?: { read(): Promise<string>; clear(): Promise<void> } | undefined;

    dappBrowser?: IDappBrowser | undefined;

    linksInterceptorAvailable?: boolean | undefined;

    ledgerConnectionPage?:
        | { isOpened: ReadonlyAtom<boolean>; open(): Promise<void>; close(): Promise<void> }
        | undefined;

    nativeBackButton?: NativeBackButton | undefined;

    subscriptionService!: ISubscriptionService;

    topMessage = (text?: string) => {
        this.uiEvents.emit('copy', { method: 'copy', id: Date.now(), params: text });
    };

    pasteFromClipboard = async () => navigator.clipboard.readText();

    copyToClipboard = (value: string, notification?: string) => {
        console.log(value, notification);

        this.topMessage(notification);
    };

    openPage = async (url: string): Promise<void> => {
        console.log(url);
    };

    openNft = (nft: NFT) => {
        this.uiEvents.emit('nft', { method: 'nft', id: Date.now(), params: nft });
    };

    disableScroll = () => {};

    enableScroll = () => {};

    getScrollbarWidth = () => 0;

    getKeyboardHeight = () => 0;

    isIOs = () => false;

    isStandalone = () => false;

    async confirm(options: ConfirmOptions) {
        return window.confirm(options.message);
    }

    alert = async (text: string) => window.alert(text);

    prompt = async (message: string, defaultValue?: string) => window.prompt(message, defaultValue);

    requestExtensionPermission = async () => {};

    twaExpand = () => {};

    hapticNotification = (_: 'success' | 'error' | 'impact_medium' | 'impact_light') => {};

    version = '0.0.0';

    reloadApp = () => {
        window.location.reload();
    };

    connectionService: InternetConnectionService = new WebConnectionService();

    abstract targetEnv: TargetEnv;

    keyboard: KeyboardService = new WebKeyboardService();

    authorizedOpenUrlProtocols = ['http:', 'https:', 'tg:', 'mailto:'];

    userIdentity: UserIdentity;

    async getAppCountryInfo(): Promise<AppCountryInfo> {
        return {
            deviceCountryCode: null,
            storeCountryCode: null
        };
    }
}

class WebKeyboardService implements KeyboardService {
    public didShow = new Subject<{ keyboardHeight: number }>();

    public willShow = new Subject<{ keyboardHeight: number }>();

    public didHide = new Subject<void>();

    public willHide = new Subject<void>();
}

class WebConnectionService implements InternetConnectionService {
    isOnline = atom(this.checkIsOnline());

    constructor() {
        window.addEventListener('online', () => this.isOnline.next(true));
        window.addEventListener('offline', () => this.isOnline.next(false));
    }

    private checkIsOnline() {
        return window.navigator.onLine;
    }

    public async retry() {
        const isOnline = this.checkIsOnline();
        this.isOnline.next(isOnline);
        return isOnline;
    }
}

export class MockAppSdk extends BaseApp {
    targetEnv = 'web' as const;

    constructor() {
        super(new MemoryStorage());
    }
}

export type TargetEnv =
    | 'web'
    | 'extension'
    | 'desktop'
    | 'twa'
    | 'tablet'
    | 'swap_widget_web'
    | 'mobile';
