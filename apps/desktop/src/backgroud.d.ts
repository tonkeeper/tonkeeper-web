interface BackgroundApi {
    platform: () => string;
    arch: () => string;
    node: () => string;
    chrome: () => string;
    electron: () => string;
    message: <Result>(message: Message) => Promise<Result>;
    onTonConnect: (callback: (url: string) => void) => void;
    onTonConnectTransaction: (callback: (value: SendTransactionAppRequest) => void) => void;
    onTonConnectDisconnect: (callback: (value: AccountConnection) => void) => void;
    onRefresh: (callback: () => void) => void;
}

declare global {
    interface Window {
        backgroundApi: BackgroundApi;
    }
}

export {};
