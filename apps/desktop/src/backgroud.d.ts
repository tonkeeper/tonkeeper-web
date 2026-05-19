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
    onTonConnect: (callback: (url: string) => void) => void;
    onTonConnectRequest: (callback: (value: TonConnectAppRequestPayload) => void) => void;
    onTonConnectDisconnect: (callback: (value: AccountConnection) => void) => void;
    onRefresh: (callback: () => void) => void;
    onUpdateAvailable: (callback: (value: UpdateInfo) => void) => void;
}

declare global {
    interface Window {
        backgroundApi: BackgroundApi;
    }
}

export {};
