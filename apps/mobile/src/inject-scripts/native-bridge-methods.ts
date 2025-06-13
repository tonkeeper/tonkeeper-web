export const NATIVE_BRIDGE_METHODS = {
    TON_CONNECT: {
        CONNECT: 'connect',
        RESTORE_CONNECTION: 'restoreConnection',
        SEND: 'SEND'
    }
};
// eslint-disable-next-line @typescript-eslint/no-redeclare
export type NATIVE_BRIDGE_METHODS = keyof typeof NATIVE_BRIDGE_METHODS;
