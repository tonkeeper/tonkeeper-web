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

export const provideMockInjectionContext = () => {
    if (getWindow()?.localStorage.getItem('test-injection-context') !== 'true') {
        return;
    }

    if (window.tonkeeperStonfi) {
        return;
    }

    window.tonkeeperStonfi = {
        address: 'UQBAA8u_tdGpCFhz-Vb5IEBmmZDZ03HOhDdBtdeTbyMSOP8V',
        close() {
            alert('"close" method is called');
        },
        async sendTransaction(params: {
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
        }) {
            console.log('"sendTransaction" method is called, params:', params);

            if (params.messages.length > 1) {
                throw new Error('Multiple messages are not supported');
            }

            const msg = params.messages[0];

            console.log();
            console.log(
                `https://app.tonkeeper.com/transfer/${encodeURIComponent(msg.address)}?amount=${
                    msg.amount
                }&bin=${encodeURIComponent(msg.payload!)}`
            );
            return 'mock_success_boc';
        }
    };
};
