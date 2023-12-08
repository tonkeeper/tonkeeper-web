interface BackgroundApi {
    node: () => string;
    chrome: () => string;
    electron: () => string;
    message: <Result>(message: Message) => Promise<Result>;
}

declare global {
    interface Window {
        backgroundApi: BackgroundApi;
    }
}

export {};
