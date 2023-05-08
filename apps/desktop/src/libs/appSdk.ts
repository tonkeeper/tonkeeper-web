import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { EventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import packageJson from '../../package.json';

export class DesktopAppSdk implements IAppSdk {
  constructor(public storage: IStorage) {}
  copyToClipboard = () => {};
  openPage = async (url: string) => {
    console.log(url);
  };

  confirm = async (text: string) => false;
  alert = async (text: string) => window.alert(text);

  uiEvents = new EventEmitter();
  version = packageJson.version ?? 'Unknown';
  disableScroll = () => null;
  enableScroll = () => null;
  getScrollbarWidth = () => 0;
  getKeyboardHeight = () => 0;
  isIOs = () => false;
  isStandalone = () => false;
}
