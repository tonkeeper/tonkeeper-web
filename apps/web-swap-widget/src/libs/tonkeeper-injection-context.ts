import { getWindow } from '@tonkeeper/core/dist/service/telegramOauth';
import {
    TON_CONNECT_MSG_VARIANTS_ID,
    TonConnectTransactionPayloadMessage
} from '@tonkeeper/core/dist/entries/tonConnect';

type UserFriendlyAddress = string;
type TimestampMS = number;

export type TonkeeperInjection = {
    address: UserFriendlyAddress;
    close: () => void;
    sendTransaction: (params: {
        source: UserFriendlyAddress;
        valid_until: TimestampMS;
        messages: {
            address: UserFriendlyAddress;
            amount: string;
            payload?: string;
        }[];
        messagesVariants?: Partial<
            Record<TON_CONNECT_MSG_VARIANTS_ID, TonConnectTransactionPayloadMessage[]>
        >;
    }) => Promise<string>;
};

declare global {
    interface Window {
        tonkeeperStonfi?: TonkeeperInjection;
    }
}

export const getTonkeeperInjectionContext = () => {
    return getWindow()?.tonkeeperStonfi;
};
