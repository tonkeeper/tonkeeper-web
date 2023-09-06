import { EventEmitter, IEventEmitter } from './entries/eventEmitter';

export type NotificationMessage = { king: 'create' };

export interface PupUpInternalEvents {
    setUpNotification: void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: any;
}

export type PopUpInternalEventEmitter = IEventEmitter<PupUpInternalEvents>;

export const popUpInternalEventEmitter: PopUpInternalEventEmitter = new EventEmitter();
