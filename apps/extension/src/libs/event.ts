import { EventEmitter, IEventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';
import {
    ConnectRequest,
    DAppManifest,
    SignDataRequestPayload,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import { ProxyConfiguration } from '../entries/proxy';
import { Account, AccountId } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';

export type PopUpEventEmitter = IEventEmitter<PupUpEvents>;
export type BackgroundEventsEmitter = IEventEmitter<BackgroundEvents>;

export type AskProcessor<R> = {
    message<Key extends string & keyof PupUpEvents>(
        eventName: `${Key}`,
        params?: PupUpEvents[Key]
    ): R;
};

export type NotificationFields<Kind extends string, Value> = {
    kind: Kind;
    id: number;
    logo?: string;
    origin: string;
    data: Value;
} & (Kind extends 'tonConnectRequest' | 'tonLinkIntercept' | 'evmConnectRequest' | 'evmSignRequest'
    ? unknown
    : {
          manifest: DAppManifest;
          /** The wallet the dApp connection belongs to; it signs the request. */
          walletId: WalletId;
      });

/** Injected-EVM (window.ethereum) connect approval: the chain we present. */
export interface EvmConnectRequestData {
    chainId: string;
}

/** Injected-EVM signing/tx approval: the raw JSON-RPC request the popup decodes and signs. */
export interface EvmSignRequestData {
    method: string;
    params: unknown[];
    chainId: string;
    address: string;
    /** The account that approved the connection; it signs the request. */
    accountId: AccountId;
}

export type NotificationData =
    | NotificationFields<'tonConnectRequest', ConnectRequest>
    | NotificationFields<'tonConnectSend', TonConnectTransactionPayload>
    | NotificationFields<'tonConnectSign', SignDataRequestPayload>
    | NotificationFields<'tonLinkIntercept', { url: string }>
    | NotificationFields<'evmConnectRequest', EvmConnectRequestData>
    | NotificationFields<'evmSignRequest', EvmSignRequestData>;

export interface PupUpEvents {
    approveRequest: PayloadRequest;
    rejectRequest: number;

    tonConnectDisconnect: string[];
    /** dApp origin whose injected-EVM connection the user removed in the popup. */
    evmDisconnect: string;

    proxyChanged: ProxyConfiguration;

    userProperties: UserProperties;
    locations: string;
    trackEvent: TrackEvent;
}

// generic popup-response channel: each emitter/listener pair owns its own payload shape
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PayloadRequest<P = any> {
    id: number;
    payload: P;
}

export interface UserProperties {
    application: string;
    walletType: string;
    accounts: Account[];
    activeAccount?: Account;
    network?: Network;
    aptabaseEndpoint: string;
    aptabaseKey: string;
}

export interface TrackEvent {
    name: string;
    params: Record<string, string | number | boolean>;
}

export interface BackgroundEvents {
    approveRequest: PayloadRequest;
    rejectRequest: number;

    closedPopUp: number;

    tonConnectDisconnect: string[];
    /** dApp origin whose injected-EVM connection the user removed in the popup. */
    evmDisconnect: string;

    proxyChanged: ProxyConfiguration;

    /** An injected-EVM (window.ethereum) event to push to the listed dApp origins. */
    evmEvent: { origins: string[]; name: string; data: unknown };
}

export const RESPONSE = 'Response';

export type AppEvent<Key extends string, Payload = void> = {
    id?: number;
    method: Key;
    params: Payload;
};

export const popUpEventEmitter: PopUpEventEmitter = new EventEmitter();
export const backgroundEventsEmitter: BackgroundEventsEmitter = new EventEmitter();
