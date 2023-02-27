import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { EventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';
import packageJson from '../../package.json';

export class DesktopAppSdk implements IAppSdk {
  copyToClipboard = () => {};
  openPage = async (url: string) => {
    console.log(url);
  };
  uiEvents = new EventEmitter();
  version = packageJson.version ?? 'Unknown';
  disableScroll = () => null;
  enableScroll = () => null;
  getScrollbarWidth = () => 0;
}
