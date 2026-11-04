/**
 * dApp page identity read from its DOM by the content script — the only
 * context that can see the page's title and favicon without the `tabs`
 * permission.
 */
export interface DAppPageMeta {
    title?: string;
    icon?: string;
}

export interface DAppMessage {
    id: number;
    method: string;
    params: unknown[];
    origin: string;
    pageMeta?: DAppPageMeta;
}

export type TonkeeperApiMessage = TonkeeperApiResponse | TonkeeperApiTonConnectEvent;

export interface TonkeeperError {
    message: string;
    code: number;
    description?: string;
}

export interface TonkeeperApiResponse {
    type: 'TonkeeperAPI';
    message: {
        jsonrpc: '2.0';
        id: number;
        method: string;
        result: undefined | unknown;
        error?: TonkeeperError;
    };
}

export interface TonkeeperApiTonConnectEvent {
    type: 'TonkeeperAPI';
    message: {
        jsonrpc: '2.0';
        id?: undefined;
        event: string;
        payload: Record<string, unknown>;
    };
}
