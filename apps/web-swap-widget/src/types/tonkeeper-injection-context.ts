import { getWindow } from '@tonkeeper/core/dist/service/telegramOauth';

type UserFriendlyAddress = string;

export type TonkeeperInjectionContext = {
    address: UserFriendlyAddress;
    sendTransaction: (params: {
        source: UserFriendlyAddress;
        valid_until: 1733389156144;
        messages: {
            address: UserFriendlyAddress;
            amount: string;
            payload: string;
        }[];
    }) => Promise<string>;
};

declare global {
    interface Window {
        tonkeeperStonfi?: TonkeeperInjectionContext;
    }
}

export const getTonkeeperInjectionContext = () => {
    return getWindow()?.tonkeeperStonfi;
};
