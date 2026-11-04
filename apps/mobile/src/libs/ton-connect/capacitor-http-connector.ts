import {
    createBridgeEndpointFetcher,
    TonConnectSSE
} from '@tonkeeper/core/dist/service/tonConnect/ton-connect-sse';
import { AccountConnection } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectAppRequestPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { App } from '@capacitor/app';
import { isSignerLink } from '@tonkeeper/uikit/dist/state/signer';
import { atom, replaySubject } from '@tonkeeper/core/dist/entries/atom';
import { capacitorStorage } from '../appSdk';

const tonConnectDisconnect$ = replaySubject<AccountConnection>('all');
const tonConnectRequest$ = replaySubject<TonConnectAppRequestPayload>('all');
const signerResponse$ = replaySubject<{
    signatureHex: string;
}>('all');

export const tonConnectSSE = new TonConnectSSE({
    storage: capacitorStorage,
    listeners: {
        onDisconnect: connection => tonConnectDisconnect$.next(connection),
        onRequest: params => tonConnectRequest$.next(params)
    },
    bridgeEndpointFetcher: createBridgeEndpointFetcher({
        platform: 'pro_mobile_ios',
        // Temporary: match appSdk — strip semver pre-release suffix from `build`.
        build: __APP_VERSION__.replace(/[-+].*$/, ''),
        onError: e => console.error(e)
    })
});
export const subscribeToHttpTonConnectDisconnect = (
    listener: (connection: AccountConnection) => void
) => {
    return tonConnectDisconnect$.subscribe(listener);
};

export const subscribeToHttpTonConnectRequest = (
    listener: (value: TonConnectAppRequestPayload) => void
) => {
    return tonConnectRequest$.subscribe(listener);
};

export const subscribeToSignerResponse = (listener: (value: { signatureHex: string }) => void) => {
    return signerResponse$.subscribe(listener);
};

const tonLink$ = atom<{ url: string; isColdStart: boolean } | undefined>(undefined);
const signerLink$ = atom<string | undefined>(undefined);
const filterNotEmpty = (callback: (value: string) => void) => (val: string | undefined) =>
    val !== undefined && callback(val);

export const subscribeToTonOrTonConnectUrlOpened = (
    listener: (url: string, isColdStart: boolean) => void
) => {
    const notify = (link: typeof tonLink$.value) =>
        link !== undefined && listener(link.url, link.isColdStart);
    notify(tonLink$.value);
    return tonLink$.subscribe(notify);
};

/**
 * Opening a link from another app moves this one to the background first, so a
 * link that arrives before the app has ever been backgrounded launched it.
 */
let hasBeenBackgrounded = false;

export const subscribeToSignerUrlOpened = (listener: (url: string) => void) => {
    if (signerLink$.value !== undefined) {
        listener(signerLink$.value);
    }
    return signerLink$.subscribe(filterNotEmpty(listener));
};

App.addListener('appUrlOpen', ({ url }) => {
    if (url) {
        console.info('Received URL:', url);

        let signerSignResponse = undefined;
        try {
            const u = new URL(url);
            signerSignResponse = u.searchParams.get('sign');
        } catch {
            /* */
        }

        if (isSignerLink(url)) {
            signerLink$.next(url);
        } else if (signerSignResponse) {
            signerResponse$.next({ signatureHex: signerSignResponse });
        } else {
            tonLink$.next({ url, isColdStart: !hasBeenBackgrounded });
        }
    }
});

App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
        tonConnectSSE.reconnect();
    } else {
        hasBeenBackgrounded = true;
        tonConnectSSE.destroy();
    }
});
