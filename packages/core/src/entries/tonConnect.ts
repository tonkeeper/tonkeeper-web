import { AccountConnection } from '../service/tonConnect/connectionService';

export interface DAppManifest {
    url: string;
    name: string;
    iconUrl: string;
    termsOfUseUrl?: string;
    privacyPolicyUrl?: string;
}

export interface TonConnectTransactionPayload {
    valid_until: number; // 1658253458;
    messages: TonConnectTransactionPayloadMessage[];
}

export interface TonConnectTransactionPayloadMessage {
    address: string; // address
    amount: string | number;
    payload?: string; // base64 cell
    stateInit?: string; // base64 cell
}

export type TonConnectAccount = {
    address: string; // '<wc>:<hex>'
    network: string; // '-239' for the mainnet and '-3' for the testnet
};

export enum CONNECT_EVENT_ERROR_CODES {
    UNKNOWN_ERROR = 0,
    BAD_REQUEST_ERROR = 1,
    MANIFEST_NOT_FOUND_ERROR = 2,
    MANIFEST_CONTENT_ERROR = 3,
    UNKNOWN_APP_ERROR = 100,
    USER_REJECTS_ERROR = 300,
    METHOD_NOT_SUPPORTED = 400
}

export enum CONNECT_ITEM_ERROR_CODES {
    UNKNOWN_ERROR = 0,
    METHOD_NOT_SUPPORTED = 400
}

export type ConnectEvent = ConnectEventSuccess | ConnectEventError;

export interface ConnectEventError {
    event: 'connect_error';
    id: number;
    payload: {
        code: CONNECT_EVENT_ERROR_CODES;
        message: string;
    };
}

export interface ConnectEventSuccess {
    event: 'connect';
    id: number;
    payload: {
        items: ConnectItemReply[];
        device: DeviceInfo;
    };
}

export type ConnectItem = TonAddressItem | TonProofItem;

export type ConnectItemReply = TonAddressItemReply | TonProofItemReply;

export type ConnectItemReplyError<T> = {
    name: T;
    error: {
        code: CONNECT_ITEM_ERROR_CODES;
        message?: string;
    };
};

export interface ConnectRequest {
    manifestUrl: string;
    items: ConnectItem[];
}

export interface DeviceInfo {
    platform: 'iphone' | 'ipad' | 'android' | 'windows' | 'mac' | 'linux' | 'browser';
    appName: string;
    appVersion: string;
    maxProtocolVersion: number;
    features: Feature[];
}

export enum DISCONNECT_ERROR_CODES {
    UNKNOWN_ERROR = 0,
    BAD_REQUEST_ERROR = 1,
    UNKNOWN_APP_ERROR = 100,
    METHOD_NOT_SUPPORTED = 400
}

export interface DisconnectEvent {
    event: 'disconnect';
    id: number | string;
    payload: Record<string, never>;
}

export interface DisconnectRpcRequest {
    method: 'disconnect';
    params: [];
    id: string;
}

export type DisconnectRpcResponse = DisconnectRpcResponseSuccess | DisconnectRpcResponseError;

export interface DisconnectRpcResponseError extends WalletResponseTemplateError {
    error: {
        code: DISCONNECT_ERROR_CODES;
        message: string;
        data?: unknown;
    };
    id: string;
}

export interface DisconnectRpcResponseSuccess {
    id: string;
    result: Record<string, never>;
}

export type Feature = SendTransactionFeatureDeprecated | SendTransactionFeature | SignDataFeature;

export interface KeyPair {
    publicKey: string;
    secretKey: string;
}

export type RpcMethod = 'disconnect' | 'sendTransaction' | 'signData';

export type RpcRequests = {
    sendTransaction: SendTransactionRpcRequest;
    signData: SignDataRpcRequest;
    disconnect: DisconnectRpcRequest;
};

export type RpcResponses = {
    sendTransaction: {
        error: SendTransactionRpcResponseError;
        success: SendTransactionRpcResponseSuccess;
    };
    signData: {
        error: SignDataRpcResponseError;
        success: SignDataRpcResponseSuccess;
    };
    disconnect: {
        error: DisconnectRpcResponseError;
        success: DisconnectRpcResponseSuccess;
    };
};

export enum SEND_TRANSACTION_ERROR_CODES {
    UNKNOWN_ERROR = 0,
    BAD_REQUEST_ERROR = 1,
    UNKNOWN_APP_ERROR = 100,
    USER_REJECTS_ERROR = 300,
    METHOD_NOT_SUPPORTED = 400
}

export type SendTransactionFeature = {
    name: 'SendTransaction';
    maxMessages: number;
};

export type SendTransactionFeatureDeprecated = 'SendTransaction';

export interface SendTransactionRpcRequest {
    method: 'sendTransaction';
    params: [string];
    id: string;
}

export type SendTransactionRpcResponse =
    | SendTransactionRpcResponseSuccess
    | SendTransactionRpcResponseError;

export interface SendTransactionRpcResponseError extends WalletResponseTemplateError {
    error: {
        code: SEND_TRANSACTION_ERROR_CODES;
        message: string;
        data?: unknown;
    };
    id: string;
}

export type SendTransactionRpcResponseSuccess = WalletResponseTemplateSuccess;

export enum SIGN_DATA_ERROR_CODES {
    UNKNOWN_ERROR = 0,
    BAD_REQUEST_ERROR = 1,
    UNKNOWN_APP_ERROR = 100,
    USER_REJECTS_ERROR = 300,
    METHOD_NOT_SUPPORTED = 400
}

export type SignDataFeature = {
    name: 'SignData';
};

export interface SignDataRpcRequest {
    method: 'signData';
    params: [
        {
            schema_crc: number;
            cell: string;
        }
    ];
    id: string;
}

export type SignDataRpcResponse = SignDataRpcResponseSuccess | SignDataRpcResponseError;

export interface SignDataRpcResponseError extends WalletResponseTemplateError {
    error: {
        code: SIGN_DATA_ERROR_CODES;
        message: string;
        data?: unknown;
    };
    id: string;
}

export interface SignDataRpcResponseSuccess {
    id: string;
    result: {
        signature: string;
        timestamp: string;
    };
}

export interface TonAddressItem {
    name: 'ton_addr';
}

export interface TonAddressItemReply {
    name: 'ton_addr';
    address: string;
    network: string;
    walletStateInit: string;
    publicKey: string;
}

export interface TonProofItem {
    name: 'ton_proof';
    payload: string;
}

export type TonProofItemReply = TonProofItemReplySuccess | TonProofItemReplyError;

export type TonProofItemReplyError = ConnectItemReplyError<TonProofItemReplySuccess['name']>;

export interface TonProofItemReplySuccess {
    name: 'ton_proof';
    proof: {
        timestamp: number;
        domain: {
            lengthBytes: number;
            value: string;
        };
        payload: string;
        signature: string;
    };
}

export type WalletEvent = ConnectEvent | DisconnectEvent;

export type WalletMessage = WalletEvent | WalletResponse<RpcMethod>;

export type WalletResponse<T extends RpcMethod> = WalletResponseSuccess<T> | WalletResponseError<T>;

export type WalletResponseError<T extends RpcMethod> = RpcResponses[T]['error'];

export type WalletResponseSuccess<T extends RpcMethod> = RpcResponses[T]['success'];

export type AppRequest<T extends RpcMethod> = RpcRequests[T];

export interface WalletResponseTemplateError {
    error: {
        code: number;
        message: string;
        data?: unknown;
    };
    id: string;
}

export interface WalletResponseTemplateSuccess {
    result: string;
    id: string;
}

export interface TonConnectAppRequest {
    request: AppRequest<RpcMethod>;
    connection: AccountConnection;
}

export interface TonConnectMessageRequest {
    message: string;
    from: string;
    connection: AccountConnection;
}
