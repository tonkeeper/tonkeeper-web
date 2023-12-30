interface BackgroundApi {
    platform: () => string;
    arch: () => string;
    version: () => string;
    node: () => string;
    chrome: () => string;
    electron: () => string;
    message: <Result>(message: Message) => Promise<Result>;
    onTonConnect: (callback: (url: string) => void) => void;
    onTonConnectTransaction: (callback: (value: SendTransactionAppRequest) => void) => void;
}

declare global {
    interface Window {
        backgroundApi: BackgroundApi;
    }
}

export {};
