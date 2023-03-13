import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { EventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import copyToClipboard from 'copy-to-clipboard';
import packageJson from '../../package.json';
import { disableScroll, enableScroll, getScrollbarWidth } from './scroll';

export class BrowserAppSdk implements IAppSdk {
  constructor(public storage: IStorage) {}
  copyToClipboard = (value: string, notification?: string) => {
    copyToClipboard(value);
    this.uiEvents.emit('copy', {
      method: 'copy',
      params: notification,
    });
  };
  openPage = async (url: string) => {
    window.open(url, '_black');
  };

  confirm = async (text: string) => window.confirm(text);

  disableScroll = disableScroll;
  enableScroll = enableScroll;
  getScrollbarWidth = getScrollbarWidth;
  getKeyboardHeight = () => 0;

  uiEvents = new EventEmitter();
  version = packageJson.version ?? 'Unknown';
}
