import { getWindow } from '@tonkeeper/core/dist/service/telegramOauth';
import {
    TON_CONNECT_MSG_VARIANTS_ID,
    TonConnectTransactionPayloadMessage
} from '@tonkeeper/core/dist/entries/tonConnect';
import { Address, beginCell, Cell, storeMessage } from '@ton/core';

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
    if (getWindow()?.localStorage.getItem('tonkeeper::test-injection-context') !== 'true') {
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

            const cell = beginCell()
                .store(
                    storeMessage({
                        info: {
                            type: 'internal',
                            ihrDisabled: true,
                            bounce: false,
                            bounced: false,
                            src: Address.parse('UQBAA8u_tdGpCFhz-Vb5IEBmmZDZ03HOhDdBtdeTbyMSOP8V'),
                            dest: Address.parse(msg.address),
                            value: { coins: BigInt(msg.amount) },
                            ihrFee: 0n,
                            forwardFee: 0n,
                            createdLt: 0n,
                            createdAt: 0
                        },
                        body: Cell.fromBase64(msg.payload!)
                    })
                )
                .endCell()
                .toBoc()
                .toString('hex');

            console.log(`https://tonviewer.com/emulate/${cell}`);

            return 'mock_success_boc';
        }
    };
};
