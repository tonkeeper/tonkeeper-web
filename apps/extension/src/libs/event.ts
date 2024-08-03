import { EventEmitter, IEventEmitter } from '@tonkeeper/core/dist/entries/eventEmitter';
import {
    ConnectRequest,
    TonConnectTransactionPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import { ProxyConfiguration } from '../entries/proxy';
import { Account } from "@tonkeeper/core/dist/entries/account";
import { Network } from "@tonkeeper/core/dist/entries/network";

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
};

export type NotificationData =
    | NotificationFields<'tonConnectRequest', ConnectRequest>
    | NotificationFields<'tonConnectSend', TonConnectTransactionPayload>;

export interface PupUpEvents {
    approveRequest: PayloadRequest;
    rejectRequest: number;

    chainChanged: string;
    accountsChanged: string[];
    tonConnectDisconnect: string[];

    proxyChanged: ProxyConfiguration;

    getNotification: void;
    closePopUp: number;

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
    accounts?: Account[];
    activeAccount?: Account;
    network?: Network;
    version?: string | undefined;
    platform?: string | undefined;
}

export interface TrackEvent {
    name: string;
    params: Record<string, any>;
}

export interface BackgroundEvents {
    approveRequest: PayloadRequest;
    rejectRequest: number;

    closedPopUp: number;

    chainChanged: string;
    accountsChanged: string[];
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
