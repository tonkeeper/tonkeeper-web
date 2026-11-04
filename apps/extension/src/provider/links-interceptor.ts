import { TonProvider } from './index';
import { ExtensionTonConnectInjectedBridge } from './tonconnect';
import { parseInterceptableTransferLink } from '../libs/tonTransferLink';

export class TonLinksInterceptor {
    private originalWindowOpen?: typeof window.open;

    private isConnected = false;

    constructor(private provider: TonProvider, tonconnect: ExtensionTonConnectInjectedBridge) {
        tonconnect.listen(event => {
            if (event.event === 'connect') {
                this.isConnected = true;
            } else if (event.event === 'connect_error' || event.event === 'disconnect') {
                this.isConnected = false;
            }
        });
    }

    private shouldInterceptLink = (href: string | undefined): href is string => {
        return this.isConnected && parseInterceptableTransferLink(href) !== null;
    };

    private processInterception(href: string) {
        this.provider.send('tonLink_intercept', href);
    }

    private clickCallback = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const anchor = target.closest<HTMLAnchorElement>('a[href]');
        if (!anchor) return;

        const href = anchor.href;

        if (this.shouldInterceptLink(href)) {
            event.preventDefault();
            event.stopPropagation();

            this.processInterception(href);
        }
    };

    private windowOpenOverride = (
        url?: string | URL,
        target?: string,
        features?: string
    ): Window | null => {
        const href = typeof url === 'string' ? url : url?.toString();

        if (this.shouldInterceptLink(href)) {
            this.processInterception(href);
            return null;
        }

        return this.originalWindowOpen!.call(window, url, target, features);
    };

    startInterceptLinks() {
        document.addEventListener('click', this.clickCallback, { capture: true });

        if (!this.originalWindowOpen) {
            this.originalWindowOpen = window.open;
            window.open = this.windowOpenOverride;
        }
    }

    stopInterceptLinks() {
        document.removeEventListener('click', this.clickCallback, { capture: true });

        if (this.originalWindowOpen) {
            window.open = this.originalWindowOpen;
            this.originalWindowOpen = undefined;
        }
    }
}
