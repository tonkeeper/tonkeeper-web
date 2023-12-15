interface BackgroundApi {
    node: () => string;
    chrome: () => string;
    electron: () => string;
    message: <Result>(message: Message) => Promise<Result>;
    onTonConnect: (callback: (ur: string) => void) => void;
}

declare global {
    interface Window {
        backgroundApi: BackgroundApi;
    }
}

export {};
