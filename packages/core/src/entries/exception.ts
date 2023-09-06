import { CONNECT_EVENT_ERROR_CODES } from './tonConnect';

export class TonConnectError extends Error {
    code: number;

    constructor(
        message: string,
        code: CONNECT_EVENT_ERROR_CODES = CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR
    ) {
        super(message);
        this.code = code;
    }
}
