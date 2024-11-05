import { AssetAmount } from '../entries/crypto/asset/asset-amount';

export class NotEnoughBalanceError extends Error {
    constructor(
        message: string,
        public readonly balance: AssetAmount,
        public readonly requiredBalance: AssetAmount
    ) {
        super(message);
        this.name = 'NotEnoughBalanceError';
    }
}
