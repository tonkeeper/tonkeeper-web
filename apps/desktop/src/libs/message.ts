import { AccountConnectionHttp } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { ConfirmOptions, KeychainScope } from '@tonkeeper/core/dist/AppSdk';
import MessageBoxSyncOptions = Electron.MessageBoxSyncOptions;

export interface GetStorageMessage {
    king: 'storage-get';
    key: string;
}

export interface SetStorageMessage {
    king: 'storage-set';
    key: string;
    value: unknown;
}

export interface SetBatchStorageMessage {
    king: 'storage-set-batch';
    value: Record<string, unknown>;
}

export interface DeleteStorageMessage {
    king: 'storage-delete';
    key: string;
}

export interface ClearStorageMessage {
    king: 'storage-clear';
}

export interface GetKeychainSettingsMessage {
    king: 'keychain-settings-get';
}

export interface CheckKeychainPasswordMessage {
    king: 'keychain-settings-check-password';
    password: string;
    scope?: KeychainScope;
}

export interface SetKeychainPasswordMessage {
    king: 'keychain-settings-set-password';
    password: string;
}

export interface SetKeychainBiometryMessage {
    king: 'keychain-settings-set-biometry';
    enabled: boolean;
}

export interface ResetKeychainSettingsMessage {
    king: 'keychain-settings-reset';
}

export interface OpenPageMessage {
    king: 'open-page';
    url: string;
}

export interface SetKeychainMessage {
    king: 'set-keychain';
    publicKey: string;
    mnemonic: string;
}

export interface GetKeychainMessage {
    king: 'get-keychain';
    publicKey: string;
}

export interface RemoveKeychainMessage {
    king: 'remove-keychain';
    publicKey: string;
}

export interface ClearKeychainMessage {
    king: 'clear-keychain';
}

export interface TonConnectMessage {
    king: 'reconnect';
}

export interface CleanCookieMessage {
    king: 'clean-cookie';
}

export interface GetPreferredSystemLanguagesMessage {
    king: 'get-preferred-system-languages';
}

export interface CanPromptTouchIdMessage {
    king: 'can-prompt-touch-id';
}

export interface PromptTouchIdMessage {
    king: 'prompt-touch-id';
    reason: string;
    scope?: KeychainScope;
}

export interface TonConnectSendDisconnectMessage {
    king: 'ton-connect-send-disconnect';
    connection: AccountConnectionHttp | AccountConnectionHttp[];
}

export interface GetDeviceCountry {
    king: 'get-device-country';
}

export interface ConfirmDialog {
    king: 'show-confirm-dialog';
    options: MessageBoxSyncOptions;
}

export type Message =
    | GetStorageMessage
    | SetStorageMessage
    | SetBatchStorageMessage
    | DeleteStorageMessage
    | ClearStorageMessage
    | GetKeychainSettingsMessage
    | CheckKeychainPasswordMessage
    | SetKeychainPasswordMessage
    | SetKeychainBiometryMessage
    | ResetKeychainSettingsMessage
    | OpenPageMessage
    | SetKeychainMessage
    | GetKeychainMessage
    | RemoveKeychainMessage
    | ClearKeychainMessage
    | TonConnectMessage
    | CanPromptTouchIdMessage
    | PromptTouchIdMessage
    | GetPreferredSystemLanguagesMessage
    | TonConnectSendDisconnectMessage
    | CleanCookieMessage
    | GetDeviceCountry
    | ConfirmDialog;
