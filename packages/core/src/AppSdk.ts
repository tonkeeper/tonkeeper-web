import { EventEmitter, IEventEmitter } from './entries/eventEmitter';
import { AuthState } from './entries/password';
import { IStorage, MemoryStorage } from './Storage';

export type GetPasswordType = 'confirm' | 'unlock';

export type GetPasswordParams = {
  auth: AuthState;
  type?: GetPasswordType;
};

export interface UIEvents {
  unlock: void;
  copy: string;
  scan: void;
  getPassword: GetPasswordParams;
  loading: void;
  response: any;
}

export interface IAppSdk {
  storage: IStorage;
  copyToClipboard: (value: string, notification?: string) => void;
  openPage: (url: string) => Promise<unknown>;
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
}

export class MockAppSdk implements IAppSdk {
  storage = new MemoryStorage();
  copyToClipboard = (value: string, notification?: string) => {
    console.log(value, notification);
  };
  openPage = async (url: string): Promise<void> => {
    console.log(url);
  };
  disableScroll = () => {};
  enableScroll = () => {};
  getScrollbarWidth = () => 0;
  getKeyboardHeight = () => 0;
  isIOs = () => false;
  isStandalone = () => false;
  uiEvents = new EventEmitter();
  version = '0.0.0';
  confirm = async () => false;
  alert = async () => void 0;
  requestExtensionPermission = async () => void 0;
}
