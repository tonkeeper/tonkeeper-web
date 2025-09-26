import { AssetAmount } from '../entries/crypto/asset/asset-amount';
import { TranslatableError } from './TranslatableError';

export class NotEnoughBalanceError extends Error implements TranslatableError {
    translate = 'confirm_error_insufficient_balance_light';

    constructor(
        message: string,
        public readonly balance: AssetAmount,
        public readonly requiredBalance: AssetAmount
    ) {
        super(message);
        this.name = 'NotEnoughBalanceError';
    }
}
