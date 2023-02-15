import { EventEmitter, IEventEmitter } from './entries/eventEmitter';

export type NotificationMessage = { king: 'create' };

export interface PupUpInternalEvents {
  setUpNotification: void;
  response: any;
}

export type PopUpInternalEventEmitter = IEventEmitter<PupUpInternalEvents>;

export const popUpInternalEventEmitter: PopUpInternalEventEmitter =
  new EventEmitter();
