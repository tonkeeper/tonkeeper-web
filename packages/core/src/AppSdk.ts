import { IStorage, MemoryStorage } from './Storage';
import { APIConfig } from './entries/apis';
import { BLOCKCHAIN_NAME } from './entries/crypto';
import { EventEmitter, IEventEmitter } from './entries/eventEmitter';
import { NFT } from './entries/nft';
import { FavoriteSuggestion, LatestSuggestion } from './entries/suggestion';
import { TonTransferParams } from './service/deeplinkingService';
import { KeystoneMessageType, KeystonePathInfo } from './service/keystone/types';
import { LedgerTransaction } from './service/ledger/connector';
import { TonContract } from './entries/wallet';

export type GetPasswordType = 'confirm' | 'unlock';

export type TransferInitParams = {
    transfer?: TonTransferParams;
    asset?: string;
    chain?: BLOCKCHAIN_NAME;
};

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
    signer: string;
    ledger: { path: number[]; transaction: LedgerTransaction };
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
}

export interface NativeBackButton {
    on: (event: 'click', listener: () => void) => void;
    off: (event: 'click', listener: () => void) => void;
    show(): void;
    hide(): void;
}

export interface KeychainPassword {
    setPassword: (publicKey: string, mnemonic: string) => Promise<void>;
    getPassword: (publicKey: string) => Promise<string>;
}

export interface TouchId {
    canPrompt: () => Promise<boolean>;
    prompt: (reason: (lang: string) => string) => Promise<void>;
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

export interface IAppSdk {
    storage: IStorage;
    nativeBackButton?: NativeBackButton;
    keychain?: KeychainPassword;
    touchId?: TouchId;

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
    hapticNotification: (type: 'success' | 'error') => void;

    notifications?: NotificationService;
    targetEnv: TargetEnv;
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

    hapticNotification = (type: 'success' | 'error') => {};

    version = '0.0.0';

    abstract targetEnv: TargetEnv;
}

export class MockAppSdk extends BaseApp {
    targetEnv = 'web' as const;

    constructor() {
        super(new MemoryStorage());
    }
}

export type TargetEnv = 'web' | 'extension' | 'desktop' | 'twa';
