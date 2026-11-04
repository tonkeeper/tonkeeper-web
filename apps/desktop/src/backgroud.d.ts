interface UpdateInfo {
    version: string;
    url: string;
}

interface BackgroundApi {
    platform: () => string;
    arch: () => string;
    node: () => string;
    chrome: () => string;
    electron: () => string;
    message: <Result>(message: Message) => Promise<Result>;
    onTonConnect: (callback: (url: string, isColdStart: boolean) => void) => void;
    onTonConnectRequest: (callback: (value: TonConnectAppRequestPayload) => void) => void;
    onTonConnectDisconnect: (callback: (value: AccountConnection) => void) => void;
    onRefresh: (callback: () => void) => void;
    onUpdateAvailable: (callback: (value: UpdateInfo) => void) => () => void;
}

declare global {
    /** Version reported to the backends; injected by the webpack configs via `scripts/app-version.js`. */
    const __APP_VERSION__: string;

    interface Window {
        backgroundApi: BackgroundApi;
    }
}

export {};
