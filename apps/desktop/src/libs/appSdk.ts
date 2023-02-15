import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { EventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';

export class DesktopAppSdk implements IAppSdk {
  copyToClipboard = () => {};
  openPage = async (url: string) => {
    console.log(url);
  };
  uiEvents = new EventEmitter();
  version = process.env.REACT_APP_VERSION ?? 'Unknown';
}
