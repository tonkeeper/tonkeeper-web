export {};

declare global {
    interface Window {
        tonkeeper: {
            provider: TonProvider;
            tonconnect: TonConnectBridge;
        };
        tonapi: TonApi;
    }
}
