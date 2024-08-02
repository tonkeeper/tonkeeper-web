/**
 * Utils methods to support services process dApp requests
 *
 * @author: KuznetsovNikita
 * @since: 0.6.1
 */

import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import {
  CONNECT_EVENT_ERROR_CODES,
} from '@tonkeeper/core/dist/entries/tonConnect';
import { backgroundEventsEmitter, PayloadRequest } from '../../event';

export const waitApprove = <Payload>(id: number, popupId?: number) => {
  return new Promise<Payload>((resolve, reject) => {
    const approve = (options: { params: PayloadRequest<Payload> }) => {
      if (options.params.id === id) {
        backgroundEventsEmitter.off('approveRequest', approve);
        backgroundEventsEmitter.off('rejectRequest', cancel);
        backgroundEventsEmitter.off('closedPopUp', close);
        resolve(options.params.payload);
      }
    };
    const close = (options: { params: number }) => {
      if (popupId === options.params) {
        backgroundEventsEmitter.off('approveRequest', approve);
        backgroundEventsEmitter.off('rejectRequest', cancel);
        backgroundEventsEmitter.off('closedPopUp', close);
        reject(
          new TonConnectError(
            'Pop-up closed',
            CONNECT_EVENT_ERROR_CODES.USER_REJECTS_ERROR
          )
        );
      }
    };
    const cancel = (options: { params: number }) => {
      if (options.params === id) {
        backgroundEventsEmitter.off('approveRequest', approve);
        backgroundEventsEmitter.off('rejectRequest', cancel);
        backgroundEventsEmitter.off('closedPopUp', close);
        reject(
          new TonConnectError(
            'Reject request',
            CONNECT_EVENT_ERROR_CODES.USER_REJECTS_ERROR
          )
        );
      }
    };
    backgroundEventsEmitter.on('approveRequest', approve);
    backgroundEventsEmitter.on('rejectRequest', cancel);
    backgroundEventsEmitter.on('closedPopUp', close);
  });
};
