import { Cell, comment, MessageRelaxed, SendMode } from '@ton/core';

export type WalletOutgoingMessage = {
    messages: MessageRelaxed[];
    sendMode: SendMode;
};

export type MessagePayloadParam =
    | {
          type: 'comment';
          value: string;
      }
    | {
          type: 'raw';
          value: Cell;
      };

export const serializePayload = (body: MessagePayloadParam | undefined) => {
    if (!body) {
        return undefined;
    }

    if (body.type === 'comment') {
        return comment(body.value);
    }

    if (body.type === 'raw') {
        return body.value;
    }
};
