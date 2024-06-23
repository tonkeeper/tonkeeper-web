import BigNumber from 'bignumber.js';

export class NotEnoughBalanceError extends Error {
    constructor(
        message: string,
        public readonly balanceWei: BigNumber,
        public readonly requiredBalanceWei: BigNumber
    ) {
        super(message);
        this.name = 'NotEnoughBalanceError';
    }
}
