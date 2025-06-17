import {
    AccountConnection,
    AccountConnectionHttp,
    AccountConnectionInjected
} from '../service/tonConnect/connectionService';
import { z } from 'zod';
import { assertTypesEqual } from '../utils/types';

/* Protocol types */

const rawAddressSchema = z.string().regex(/^(0|-1):[0-9a-fA-F]{64}$/);
const tonConnectNetworkSchema = z.union([
    z.literal(-239),
    z.literal(-3),
    z.literal('-239'),
    z.literal('-3')
]);

export type TonConnectNetwork = z.infer<typeof tonConnectNetworkSchema>;

const dAppManifestSchema = z.object({
    url: z.string(),
    name: z.string(),
    iconUrl: z.string(),
    termsOfUseUrl: z.string().optional(),
    privacyPolicyUrl: z.string().optional()
});

export type DAppManifest = z.infer<typeof dAppManifestSchema>;

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

const batteryMessagesVariantSchema = z.object({
    messages: z.array(TonConnectTransactionPayloadMessageSchema)
});
export type BatteryMessagesVariant = z.infer<typeof batteryMessagesVariantSchema>;

const gaslessMessagesVariantSchema = z.object({
    messages: z.array(TonConnectTransactionPayloadMessageSchema),
    options: z.object({
        asset: z.string()
    })
});
export type GaslessMessagesVariant = z.infer<typeof gaslessMessagesVariantSchema>;

export const transactionRequestPayloadSchema = z.object({
    network: tonConnectNetworkSchema.optional(),
    from: rawAddressSchema.optional(),
    valid_until: z.number(),
    messages: z.array(TonConnectTransactionPayloadMessageSchema),
    messagesVariants: z
        .object({
            battery: batteryMessagesVariantSchema.optional(),
            gasless: gaslessMessagesVariantSchema.optional()
        })
        .optional()
});
export type TonConnectTransactionPayload = z.infer<typeof transactionRequestPayloadSchema>;

const tonConnectAccountSchema = z.object({
    address: z.string(), // '<wc>:<hex>'
    network: z.string() // '-239' for the mainnet and '-3' for the testnet
});
export type TonConnectAccount = z.infer<typeof tonConnectAccountSchema>;

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

const tonAddressItemReplySchema = z.object({
    name: z.literal('ton_addr'),
    address: z.string(),
    network: z.string(),
    walletStateInit: z.string(),
    publicKey: z.string().optional()
});
export type TonAddressItemReply = z.infer<typeof tonAddressItemReplySchema>;

const tonProofItemReplyErrorSchema = z.object({
    name: z.literal('ton_proof'),
    error: z.object({
        code: z.nativeEnum(CONNECT_ITEM_ERROR_CODES),
        message: z.string().optional()
    })
});
export type TonProofItemReplyError = z.infer<typeof tonProofItemReplyErrorSchema>;

const tonProofItemReplySuccessSchema = z.object({
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
export type TonProofItemReplySuccess = z.infer<typeof tonProofItemReplySuccessSchema>;

const tonProofItemReplySchema = z.union([
    tonProofItemReplySuccessSchema,
    tonProofItemReplyErrorSchema
]);
export type TonProofItemReply = z.infer<typeof tonProofItemReplySchema>;

const connectItemReplySchema = z.union([tonAddressItemReplySchema, tonProofItemReplySchema]);
export type ConnectItemReply = z.infer<typeof connectItemReplySchema>;

export enum DISCONNECT_ERROR_CODES {
    UNKNOWN_ERROR = 0,
    BAD_REQUEST_ERROR = 1,
    UNKNOWN_APP_ERROR = 100,
    METHOD_NOT_SUPPORTED = 400
}

const disconnectEventSchema = z.object({
    event: z.literal('disconnect'),
    id: z.union([z.number(), z.string()]),
    payload: z.object({})
});
export type DisconnectEvent = z.infer<typeof disconnectEventSchema>;

const disconnectRpcRequestSchema = z.object({
    method: z.literal('disconnect'),
    params: z.tuple([]),
    id: z.string()
});
export type DisconnectRpcRequest = z.infer<typeof disconnectRpcRequestSchema>;

const disconnectRpcResponseErrorSchema = z.object({
    id: z.string(),
    error: z.object({
        code: z.nativeEnum(DISCONNECT_ERROR_CODES),
        message: z.string(),
        data: z.unknown().optional()
    })
});
export type DisconnectRpcResponseError = z.infer<typeof disconnectRpcResponseErrorSchema>;

const disconnectRpcResponseSuccessSchema = z.object({
    id: z.string(),
    result: z.object({})
});
export type DisconnectRpcResponseSuccess = z.infer<typeof disconnectRpcResponseSuccessSchema>;

const disconnectRpcResponseSchema = z.union([
    disconnectRpcResponseSuccessSchema,
    disconnectRpcResponseErrorSchema
]);
export type DisconnectRpcResponse = z.infer<typeof disconnectRpcResponseSchema>;

const sendTransactionFeatureDeprecatedSchema = z.literal('SendTransaction');
export type SendTransactionFeatureDeprecated = z.infer<
    typeof sendTransactionFeatureDeprecatedSchema
>;

const sendTransactionFeatureSchema = z.object({
    name: z.literal('SendTransaction'),
    maxMessages: z.number(),
    extraCurrencySupported: z.boolean().optional()
});
export type SendTransactionFeature = z.infer<typeof sendTransactionFeatureSchema>;

const signDataTypeSchema = z.array(z.enum(['text', 'binary', 'cell']));
export type SignDataType = z.infer<typeof signDataTypeSchema>;

const signDataFeatureSchema = z.object({
    name: z.literal('SignData'),
    types: signDataTypeSchema
});
export type SignDataFeature = z.infer<typeof signDataFeatureSchema>;

export const featureSchema = z.union([
    sendTransactionFeatureDeprecatedSchema,
    sendTransactionFeatureSchema,
    signDataFeatureSchema
]);
export type Feature = z.infer<typeof featureSchema>;

const deviceInfoSchema = z.object({
    platform: z.enum(['iphone', 'ipad', 'android', 'windows', 'mac', 'linux', 'browser']),
    appName: z.string(),
    appVersion: z.string(),
    maxProtocolVersion: z.number(),
    features: z.array(featureSchema)
});

export type DeviceInfo = z.infer<typeof deviceInfoSchema>;

const tonConnectEventPayloadSchema = z.object({
    items: z.array(connectItemReplySchema),
    device: deviceInfoSchema
});
export type TonConnectEventPayload = z.infer<typeof tonConnectEventPayloadSchema>;

const connectEventSuccessSchema = z.object({
    event: z.literal('connect'),
    id: z.number(),
    payload: tonConnectEventPayloadSchema
});
export type ConnectEventSuccess = z.infer<typeof connectEventSuccessSchema>;

const connectEventErrorSchema = z.object({
    event: z.literal('connect_error'),
    id: z.number(),
    payload: z.object({
        code: z.nativeEnum(CONNECT_EVENT_ERROR_CODES),
        message: z.string()
    })
});
export type ConnectEventError = z.infer<typeof connectEventErrorSchema>;

const connectEventSchema = z.union([connectEventSuccessSchema, connectEventErrorSchema]);
export type ConnectEvent = z.infer<typeof connectEventSchema>;

const tonAddressItemSchema = z.object({
    name: z.literal('ton_addr')
});
export type TonAddressItem = z.infer<typeof tonAddressItemSchema>;

const tonProofItemSchema = z.object({
    name: z.literal('ton_proof'),
    payload: z.string()
});
export type TonProofItem = z.infer<typeof tonProofItemSchema>;

const connectItemSchema = z.union([tonAddressItemSchema, tonProofItemSchema]);
export type ConnectItem = z.infer<typeof connectItemSchema>;

export const connectRequestSchema = z.object({
    manifestUrl: z.string(),
    items: z.array(connectItemSchema)
});
export type ConnectRequest = z.infer<typeof connectRequestSchema>;

const keyPairSchema = z.object({
    publicKey: z.string(),
    secretKey: z.string()
});
export type KeyPair = z.infer<typeof keyPairSchema>;

const rpcMethodSchema = z.enum(['disconnect', 'sendTransaction', 'signData']);
export type RpcMethod = z.infer<typeof rpcMethodSchema>;

export enum SEND_TRANSACTION_ERROR_CODES {
    UNKNOWN_ERROR = 0,
    BAD_REQUEST_ERROR = 1,
    UNKNOWN_APP_ERROR = 100,
    USER_REJECTS_ERROR = 300,
    METHOD_NOT_SUPPORTED = 400
}

const sendTransactionRpcRequestSchema = z.object({
    method: z.literal('sendTransaction'),
    params: z.tuple([z.string()]),
    id: z.string()
});
export type SendTransactionRpcRequest = z.infer<typeof sendTransactionRpcRequestSchema>;

export type SendTransactionRpcResponse =
    | SendTransactionRpcResponseSuccess
    | SendTransactionRpcResponseError;

const sendTransactionRpcResponseErrorSchema = z.object({
    error: z.object({
        code: z.nativeEnum(SEND_TRANSACTION_ERROR_CODES),
        message: z.string(),
        data: z.unknown().optional()
    }),
    id: z.string()
});
export type SendTransactionRpcResponseError = z.infer<typeof sendTransactionRpcResponseErrorSchema>;

const sendTransactionRpcResponseSuccessSchema = z.object({
    result: z.string(),
    id: z.string()
});
export type SendTransactionRpcResponseSuccess = z.infer<
    typeof sendTransactionRpcResponseSuccessSchema
>;

export enum SIGN_DATA_ERROR_CODES {
    UNKNOWN_ERROR = 0,
    BAD_REQUEST_ERROR = 1,
    UNKNOWN_APP_ERROR = 100,
    USER_REJECTS_ERROR = 300,
    METHOD_NOT_SUPPORTED = 400
}

const signDataRpcRequestSchema = z.object({
    id: z.string(),
    method: z.literal('signData'),
    params: z.tuple([z.string()])
});
export type SignDataRpcRequest = z.infer<typeof signDataRpcRequestSchema>;

const signDataRequestPayloadTextSchema = z.object({
    network: tonConnectNetworkSchema.optional(),
    from: rawAddressSchema.optional(),
    type: z.literal('text'),
    text: z.string()
});
export type SignDataRequestPayloadText = z.infer<typeof signDataRequestPayloadTextSchema>;

const signDataRequestPayloadBinarySchema = z.object({
    network: tonConnectNetworkSchema.optional(),
    from: rawAddressSchema.optional(),
    type: z.literal('binary'),
    bytes: z.string() // base64 string
});
export type SignDataRequestPayloadBinary = z.infer<typeof signDataRequestPayloadBinarySchema>;

const signDataRequestPayloadCellSchema = z.object({
    network: tonConnectNetworkSchema.optional(),
    from: rawAddressSchema.optional(),
    type: z.literal('cell'),
    schema: z.string(), // TL-B scheme
    cell: z.string() // base64 string
});
export type SignDataRequestPayloadCell = z.infer<typeof signDataRequestPayloadCellSchema>;

export const signDataRequestPayloadSchema = z.union([
    signDataRequestPayloadTextSchema,
    signDataRequestPayloadBinarySchema,
    signDataRequestPayloadCellSchema
]);
export type SignDataRequestPayload = z.infer<typeof signDataRequestPayloadSchema>;

const rpcRequestsSchema = z.object({
    sendTransaction: sendTransactionRpcRequestSchema,
    signData: signDataRpcRequestSchema,
    disconnect: disconnectRpcRequestSchema
});
export type RpcRequests = z.infer<typeof rpcRequestsSchema>;

const signDataRpcResponseErrorSchema = z.object({
    error: z.object({
        code: z.nativeEnum(SIGN_DATA_ERROR_CODES),
        message: z.string()
    }),
    id: z.string()
});
export type SignDataRpcResponseError = z.infer<typeof signDataRpcResponseErrorSchema>;

export const SignDataResponseSchema = z.object({
    signature: z.string(), // base64 encoded signature
    address: z.string(),
    timestamp: z.number(), // UNIX timestamp in seconds (UTC) at the moment on creating the signature.
    domain: z.string(), // app domain name (as url part, without encoding)
    payload: signDataRequestPayloadSchema
});
export type SignDataResponse = z.infer<typeof SignDataResponseSchema>;

const signDataRpcResponseSuccessSchema = z.object({
    id: z.string(),
    result: SignDataResponseSchema
});
export type SignDataRpcResponseSuccess = z.infer<typeof signDataRpcResponseSuccessSchema>;

const signDataRpcResponseSchema = z.union([
    signDataRpcResponseSuccessSchema,
    signDataRpcResponseErrorSchema
]);
export type SignDataRpcResponse = z.infer<typeof signDataRpcResponseSchema>;

const rpcResponsesSchema = z.object({
    sendTransaction: z.object({
        error: sendTransactionRpcResponseErrorSchema,
        success: sendTransactionRpcResponseSuccessSchema
    }),
    signData: z.object({
        error: signDataRpcResponseErrorSchema,
        success: signDataRpcResponseSuccessSchema
    }),
    disconnect: z.object({
        error: disconnectRpcResponseErrorSchema,
        success: disconnectRpcResponseSuccessSchema
    })
});
export type RpcResponses = z.infer<typeof rpcResponsesSchema>;

const walletEventSchema = z.union([connectEventSchema, disconnectEventSchema]);
export type WalletEvent = z.infer<typeof walletEventSchema>;

export const walletResponseSchema = z.union([
    sendTransactionRpcResponseSuccessSchema,
    sendTransactionRpcResponseErrorSchema,
    signDataRpcResponseSuccessSchema,
    signDataRpcResponseErrorSchema,
    disconnectRpcResponseSuccessSchema,
    disconnectRpcResponseErrorSchema
]);

export type WalletResponse<T extends RpcMethod> = WalletResponseSuccess<T> | WalletResponseError<T>;
export type WalletResponseError<T extends RpcMethod> = RpcResponses[T]['error'];
export type WalletResponseSuccess<T extends RpcMethod> = RpcResponses[T]['success'];
assertTypesEqual<WalletResponse<RpcMethod>, z.infer<typeof walletResponseSchema>>(true);

export const walletMessageSchema = z.union([walletEventSchema, walletResponseSchema]);
export type WalletMessage = WalletEvent | WalletResponse<RpcMethod>;
assertTypesEqual<WalletMessage, z.infer<typeof walletMessageSchema>>(true);

export const appRequestSchema = z.union([
    sendTransactionRpcRequestSchema,
    signDataRpcRequestSchema,
    disconnectRpcRequestSchema
]);
export type AppRequest<T extends RpcMethod> = RpcRequests[T];
assertTypesEqual<AppRequest<RpcMethod>, z.infer<typeof appRequestSchema>>(true);

/* App internal types */
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
