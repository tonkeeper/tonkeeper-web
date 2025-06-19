import { TonConnectSSE } from '@tonkeeper/core/dist/service/tonConnect/ton-connect-sse';
import { AccountConnection } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectAppRequestPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { App } from '@capacitor/app';
import { isSignerLink } from '@tonkeeper/uikit/dist/state/signer';
import { atom, subject } from '@tonkeeper/core/dist/entries/atom';
import { capacitorStorage } from '../appSdk';

const tonConnectDisconnect$ = subject<AccountConnection>();
const tonConnectRequest$ = subject<TonConnectAppRequestPayload>();
const signerResponse$ = subject<{
    signatureHex: string;
}>();

export const tonConnectSSE = new TonConnectSSE({
    storage: capacitorStorage,
    listeners: {
        onDisconnect: connection => tonConnectDisconnect$.next(connection),
        onRequest: params => tonConnectRequest$.next(params)
    }
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

const tonLink$ = atom<string | undefined>(undefined);
const signerLink$ = atom<string | undefined>(undefined);
const filterNotEmpty = (callback: (value: string) => void) => (val: string | undefined) =>
    val !== undefined && callback(val);

export const subscribeToTonOrTonConnectUrlOpened = (listener: (url: string) => void) => {
    if (tonLink$.value !== undefined) {
        listener(tonLink$.value);
    }
    return tonLink$.subscribe(filterNotEmpty(listener));
};

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
            tonLink$.next(url);
        }
    }
});

App.addListener('appStateChange', async ({ isActive }) => {
    if (isActive) {
        tonConnectSSE.reconnect();
    } else {
        tonConnectSSE.destroy();
    }
});
