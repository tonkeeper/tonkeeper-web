import { IStorage, MemoryStorage } from './Storage';
import { APIConfig } from './entries/apis';
import { BLOCKCHAIN_NAME } from './entries/crypto';
import { EventEmitter, IEventEmitter } from './entries/eventEmitter';
import { NFT } from './entries/nft';
import { FavoriteSuggestion, LatestSuggestion } from './entries/suggestion';
import { TonContract, TonWalletStandard } from './entries/wallet';
import { KeystoneMessageType, KeystonePathInfo } from './service/keystone/types';
import { LedgerTonProofRequest, LedgerTransaction } from './service/ledger/connector';
import { TonTransferParams } from './service/deeplinkingService';
import { atom, ReadonlyAtom } from './entries/atom';

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

export interface IAppSdk {
    storage: IStorage;
    nativeBackButton?: NativeBackButton;
    keychain?: IKeychainService;
    cookie?: CookieService;
    biometry?: BiometryService;

    topMessage: (text: string) => void;
    copyToClipboard: (value: string, notification?: string) => void;
    openPage: (url: string) => Promise<unknown>;
    openNft: (nft: NFT) => void;

    disableScroll: () => void;
    enableScroll: () => void;
    getScrollbarWidth: () => number;
    getKeyboardHeight: () => number;
    isIOs: () => boolean;
    isStandalone: () => boolean;
    uiEvents: IEventEmitter<UIEvents>;
    version: string;

    confirm: (text: string) => Promise<boolean>;
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
}

export abstract class BaseApp implements IAppSdk {
    uiEvents = new EventEmitter();

    constructor(public storage: IStorage) {}

    nativeBackButton?: NativeBackButton | undefined;

    topMessage = (text?: string) => {
        this.uiEvents.emit('copy', { method: 'copy', id: Date.now(), params: text });
    };

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

    confirm = async (text: string) => window.confirm(text);

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
