import { EventEmitter, IEventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';
import {
    ConnectRequest,
    DAppManifest,
    SignDataRequestPayload,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import { ProxyConfiguration } from '../entries/proxy';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';

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
} & (Kind extends 'tonConnectRequest' | 'tonLinkIntercept' ? {} : { manifest: DAppManifest });

export type NotificationData =
    | NotificationFields<'tonConnectRequest', ConnectRequest>
    | NotificationFields<'tonConnectSend', TonConnectTransactionPayload>
    | NotificationFields<'tonConnectSign', SignDataRequestPayload>
    | NotificationFields<'tonLinkIntercept', { url: string }>;

export interface PupUpEvents {
    approveRequest: PayloadRequest;
    rejectRequest: number;

    tonConnectDisconnect: string[];

    proxyChanged: ProxyConfiguration;

    userProperties: UserProperties;
    locations: string;
    trackEvent: TrackEvent;
}

export interface PayloadRequest<P = any> {
    id: number;
    payload: P;
}

export interface UserProperties {
    application: string;
    walletType: string;
    accounts: Account[];
    activeAccount: Account;
    network?: Network;
}

export interface TrackEvent {
    name: string;
    params: Record<string, any>;
}

export interface BackgroundEvents {
    approveRequest: PayloadRequest;
    rejectRequest: number;

    closedPopUp: number;

    tonConnectDisconnect: string[];

    proxyChanged: ProxyConfiguration;
}

export const RESPONSE = 'Response';

export type AppEvent<Key extends string, Payload = void> = {
    id?: number;
    method: Key;
    params: Payload;
};

export const popUpEventEmitter: PopUpEventEmitter = new EventEmitter();
export const backgroundEventsEmitter: BackgroundEventsEmitter = new EventEmitter();
