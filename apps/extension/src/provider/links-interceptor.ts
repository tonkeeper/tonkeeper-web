import { TonProvider } from './index';

export class TonLinksInterceptor {
    private originalWindowOpen?: typeof window.open;

    constructor(private provider: TonProvider) {}

    private shouldInterceptLink = (href: string | undefined): href is string => {
        return Boolean(
            href?.startsWith('https://app.tonkeeper.com/transfer/') || href?.startsWith('ton://')
        );
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
        url?: string | URL | undefined,
        ...args: any[]
    ): Window | null => {
        const href = typeof url === 'string' ? url : url?.toString();

        if (this.shouldInterceptLink(href)) {
            this.processInterception(href);
            return null;
        }

        const [target, features] = args;
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
