import { BLOCKCHAIN_NAME } from './entries/crypto';
import { EventEmitter, IEventEmitter } from './entries/eventEmitter';
import { NFT } from './entries/nft';
import { AuthState } from './entries/password';
import { TonTransferParams } from './service/deeplinkingService';
import { IStorage, MemoryStorage } from './Storage';

export type GetPasswordType = 'confirm' | 'unlock';

export type GetPasswordParams = {
    auth: AuthState;
    type?: GetPasswordType;
};

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
    getPassword: GetPasswordParams;
    loading: void;
    transfer: TransferInitParams;
    receive: ReceiveInitParams;
    nft: NFT;
    transferNft: NFT;
    keyboard: KeyboardParams;
    response: any;
}

export interface NativeBackButton {
    on: (event: 'click', listener: () => void) => void;
    off: (event: 'click', listener: () => void) => void;
    show(): void;
    hide(): void;
}

export interface NotificationService {
    subscribe: (wallet: string, mnemonic: string[]) => Promise<void>;
    unsubscribe: (wallet: string, mnemonic: string[]) => Promise<void>;

    subscribeTonConnect: (sessionKey: string) => Promise<void>;
    unsubscribeTonConnect: (sessionKey: string) => Promise<void>;

    subscribed: (wallet: string) => Promise<boolean>;
}

export interface IAppSdk {
    storage: IStorage;
    nativeBackButton?: NativeBackButton;

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

    requestExtensionPermission: () => Promise<void>;
    twaExpand?: () => void;
    hapticNotification: (type: 'success' | 'error') => void;

    notifications?: NotificationService;
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

    version = '0.0.0';

    confirm = async (_: string) => false;

    alert = async (_: string) => {};

    requestExtensionPermission = async () => {};

    twaExpand = () => {};

    hapticNotification = (type: 'success' | 'error') => {};
}

export class MockAppSdk extends BaseApp {
    constructor() {
        super(new MemoryStorage());
    }
}
