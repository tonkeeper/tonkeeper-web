import { MessageRelaxed, SendMode } from '@ton/core';

export type WalletOutgoingMessage = {
    messages: MessageRelaxed[];
    sendMode: SendMode;
};
