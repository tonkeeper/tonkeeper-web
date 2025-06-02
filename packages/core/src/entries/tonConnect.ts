import {
    AccountConnection,
    AccountConnectionHttp,
    AccountConnectionInjected
} from '../service/tonConnect/connectionService';
import { z } from 'zod';

export const DAppManifestSchema = z.object({
    url: z.string(),
    name: z.string(),
    iconUrl: z.string(),
    termsOfUseUrl: z.string().optional(),
    privacyPolicyUrl: z.string().optional()
});

export type DAppManifest = z.infer<typeof DAppManifestSchema>;

export enum TON_CONNECT_MSG_VARIANTS_ID {
    BATTERY = 'battery',
    GASLESS = 'gasless'
}

const TonConnectTransactionPayloadMessageSchema = z.object({
    address: z.string(),
    amount: z.union([z.string(), z.number()]),
    payload: z.string().optional(),
    stateInit: z.string().optional(),
    extra_currency: z.record(z.string()).optional()
});
export type TonConnectTransactionPayloadMessage = z.infer<
    typeof TonConnectTransactionPayloadMessageSchema
>;

export const BatteryMessagesVariantSchema = z.object({
    messages: z.array(TonConnectTransactionPayloadMessageSchema)
});
export type BatteryMessagesVariant = z.infer<typeof BatteryMessagesVariantSchema>;

export const GaslessMessagesVariantSchema = z.object({
    messages: z.array(TonConnectTransactionPayloadMessageSchema),
    options: z.object({
        asset: z.string()
    })
});
export type GaslessMessagesVariant = z.infer<typeof GaslessMessagesVariantSchema>;

export const TonConnectTransactionPayloadSchema = z.object({
    valid_until: z.number(),
    messages: z.array(TonConnectTransactionPayloadMessageSchema),
    messagesVariants: z
        .object({
            battery: BatteryMessagesVariantSchema.optional(),
            gasless: GaslessMessagesVariantSchema.optional()
        })
        .optional()
});
export type TonConnectTransactionPayload = z.infer<typeof TonConnectTransactionPayloadSchema>;

export const TonConnectAccountSchema = z.object({
    address: z.string(), // '<wc>:<hex>'
    network: z.string() // '-239' for the mainnet and '-3' for the testnet
});
export type TonConnectAccount = z.infer<typeof TonConnectAccountSchema>;

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

export const ConnectEventErrorSchema = z.object({
    event: z.literal('connect_error'),
    id: z.number(),
    payload: z.object({
        code: z.number(), // or enum
        message: z.string()
    })
});
export type ConnectEventError = z.infer<typeof ConnectEventErrorSchema>;

export interface TonConnectEventPayload {
    items: ConnectItemReply[];
    device: DeviceInfo;
}

export interface ConnectEventSuccess {
    event: 'connect';
    id: number;
    payload: TonConnectEventPayload;
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
    extraCurrencySupported?: boolean;
};

export type SendTransactionFeatureDeprecated = 'SendTransaction';

export const SendTransactionRpcRequestSchema = z.object({
    method: z.literal('sendTransaction'),
    params: z.tuple([z.string()]),
    id: z.string()
});
export type SendTransactionRpcRequest = z.infer<typeof SendTransactionRpcRequestSchema>;

export type SendTransactionRpcResponse =
    | SendTransactionRpcResponseSuccess
    | SendTransactionRpcResponseError;

export const SendTransactionRpcResponseErrorSchema = z.object({
    error: z.object({
        code: z.nativeEnum(SEND_TRANSACTION_ERROR_CODES),
        message: z.string(),
        data: z.unknown().optional()
    }),
    id: z.string()
});
export type SendTransactionRpcResponseError = z.infer<typeof SendTransactionRpcResponseErrorSchema>;

export const SendTransactionRpcResponseSuccessSchema = z.object({
    result: z.string(),
    id: z.string()
});
export type SendTransactionRpcResponseSuccess = z.infer<
    typeof SendTransactionRpcResponseSuccessSchema
>;

export enum SIGN_DATA_ERROR_CODES {
    UNKNOWN_ERROR = 0,
    BAD_REQUEST_ERROR = 1,
    UNKNOWN_APP_ERROR = 100,
    USER_REJECTS_ERROR = 300,
    METHOD_NOT_SUPPORTED = 400
}

export declare type SignDataType = 'text' | 'binary' | 'cell';

export type SignDataFeature = {
    name: 'SignData';
    types: SignDataType[];
};

export const SignDataRpcRequestSchema = z.object({
    id: z.string(),
    method: z.literal('signData'),
    params: z.tuple([z.string()])
});
export type SignDataRpcRequest = z.infer<typeof SignDataRpcRequestSchema>;

export const SignDataRequestPayloadTextSchema = z.object({
    type: z.literal('text'),
    text: z.string()
});
export type SignDataRequestPayloadText = z.infer<typeof SignDataRequestPayloadTextSchema>;

export const SignDataRequestPayloadBinarySchema = z.object({
    type: z.literal('binary'),
    bytes: z.string() // base64 string
});
export type SignDataRequestPayloadBinary = z.infer<typeof SignDataRequestPayloadBinarySchema>;

export const SignDataRequestPayloadCellSchema = z.object({
    type: z.literal('cell'),
    schema: z.string(), // TL-B scheme
    cell: z.string() // base64 string
});
export type SignDataRequestPayloadCell = z.infer<typeof SignDataRequestPayloadCellSchema>;

export const SignDataRequestPayloadSchema = z.union([
    SignDataRequestPayloadTextSchema,
    SignDataRequestPayloadBinarySchema,
    SignDataRequestPayloadCellSchema
]);
export type SignDataRequestPayload = z.infer<typeof SignDataRequestPayloadSchema>;

export const SignDataRpcResponseErrorSchema = z.object({
    error: z.object({
        code: z.nativeEnum(SIGN_DATA_ERROR_CODES),
        message: z.string()
    }),
    id: z.string()
});
export type SignDataRpcResponseError = z.infer<typeof SignDataRpcResponseErrorSchema>;

export const SignDataResponseSchema = z.object({
    signature: z.string(), // base64 encoded signature
    address: z.string(),
    timestamp: z.number(), // UNIX timestamp in seconds (UTC) at the moment on creating the signature.
    domain: z.string(), // app domain name (as url part, without encoding)
    payload: SignDataRequestPayloadSchema
});
export type SignDataResponse = z.infer<typeof SignDataResponseSchema>;

export const SignDataRpcResponseSuccessSchema = z.object({
    id: z.string(),
    result: SignDataResponseSchema
});
export type SignDataRpcResponseSuccess = z.infer<typeof SignDataRpcResponseSuccessSchema>;

export const SignDataRpcResponseSchema = z.union([
    SignDataRpcResponseSuccessSchema,
    SignDataRpcResponseErrorSchema
]);
export type SignDataRpcResponse = z.infer<typeof SignDataRpcResponseSchema>;

export const TonAddressItemSchema = z.object({
    name: z.literal('ton_addr')
});
export type TonAddressItem = z.infer<typeof TonAddressItemSchema>;

export const TonAddressItemReplySchema = z.object({
    name: z.literal('ton_addr'),
    address: z.string(),
    network: z.string(),
    walletStateInit: z.string(),
    publicKey: z.string().optional()
});
export type TonAddressItemReply = z.infer<typeof TonAddressItemReplySchema>;

export const TonProofItemSchema = z.object({
    name: z.literal('ton_proof'),
    payload: z.string()
});
export type TonProofItem = z.infer<typeof TonProofItemSchema>;

export const TonProofItemReplyErrorSchema = z.object({
    name: z.literal('ton_proof'),
    error: z.object({
        code: z.nativeEnum(CONNECT_ITEM_ERROR_CODES),
        message: z.string().optional()
    })
});
export type TonProofItemReplyError = z.infer<typeof TonProofItemReplyErrorSchema>;

export const TonProofItemReplySuccessSchema = z.object({
    name: z.literal('ton_proof'),
    proof: z.object({
        timestamp: z.number(),
        domain: z.object({
            lengthBytes: z.number(),
            value: z.string()
        }),
        payload: z.string(),
        signature: z.string()
    })
});
export type TonProofItemReplySuccess = z.infer<typeof TonProofItemReplySuccessSchema>;

export const TonProofItemReplySchema = z.union([
    TonProofItemReplySuccessSchema,
    TonProofItemReplyErrorSchema
]);
export type TonProofItemReply = z.infer<typeof TonProofItemReplySchema>;

export type WalletEvent = ConnectEvent | DisconnectEvent;

export type WalletMessage = WalletEvent | WalletResponse<RpcMethod>;

export type WalletResponse<T extends RpcMethod> = WalletResponseSuccess<T> | WalletResponseError<T>;

export type WalletResponseError<T extends RpcMethod> = RpcResponses[T]['error'];

export type WalletResponseSuccess<T extends RpcMethod> = RpcResponses[T]['success'];

export type AppRequest<T extends RpcMethod> = RpcRequests[T];

export const WalletResponseTemplateErrorSchema = z.object({
    error: z.object({
        code: z.number(),
        message: z.string(),
        data: z.unknown().optional()
    }),
    id: z.string()
});
export type WalletResponseTemplateError = z.infer<typeof WalletResponseTemplateErrorSchema>;

export interface WalletResponseTemplateSuccess {
    result: string;
    id: string;
}

export interface TonConnectAppRequest<T extends AccountConnection['type']> {
    request: AppRequest<RpcMethod>;
    connection: T extends 'http' ? AccountConnectionHttp : AccountConnectionInjected;
}

export interface SendTransactionAppRequest<
    T extends AccountConnection['type'] = AccountConnection['type']
> {
    id: string;
    connection: T extends 'http'
        ? AccountConnectionHttp
        : T extends 'injected'
        ? AccountConnectionInjected
        : AccountConnection;
    kind: 'sendTransaction';
    payload: TonConnectTransactionPayload;
}

export interface SignDatAppRequest<
    T extends AccountConnection['type'] = AccountConnection['type']
> {
    id: string;
    connection: T extends 'http'
        ? AccountConnectionHttp
        : T extends 'injected'
        ? AccountConnectionInjected
        : AccountConnection;
    kind: 'signData';
    payload: SignDataRequestPayload;
}

export type TonConnectAppRequestPayload<
    T extends AccountConnection['type'] = AccountConnection['type']
> = SendTransactionAppRequest<T> | SignDatAppRequest<T>;

export interface InjectedWalletInfo {
    name: string;
    image: string;
    tondns?: string;
    about_url: string;
}

export interface ITonConnectInjectedBridge {
    deviceInfo: DeviceInfo;
    walletInfo?: InjectedWalletInfo;
    protocolVersion: number;
    isWalletBrowser: boolean;
    connect(protocolVersion: number, message: ConnectRequest): Promise<ConnectEvent>;
    restoreConnection(): Promise<ConnectEvent>;
    send<T extends RpcMethod>(message: AppRequest<T>): Promise<WalletResponse<T>>;
    listen(callback: (event: WalletEvent) => void): () => void;
}
