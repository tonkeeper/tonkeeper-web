import { getWindow } from '@tonkeeper/core/dist/service/telegramOauth';

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
