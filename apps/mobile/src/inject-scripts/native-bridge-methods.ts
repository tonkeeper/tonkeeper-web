export const NATIVE_BRIDGE_METHODS = {
    TON_CONNECT: {
        CONNECT: 'tc_connect',
        RESTORE_CONNECTION: 'tc_restoreConnection',
        SEND: 'tc_send'
    },
    TG_AUTH: {
        SEND_RESULT: 'tg_sendResult'
    }
};
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type NATIVE_BRIDGE_METHODS = keyof typeof NATIVE_BRIDGE_METHODS;
