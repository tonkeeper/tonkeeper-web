import { TronTransactionFee } from '../entries/crypto/transaction-fee';

export class TronNotEnoughBalanceEstimationError extends Error {
    constructor(message: string, public readonly fee?: TronTransactionFee) {
        super(message);
        this.name = 'TronNotEnoughBalanceEstimationError';
    }
}
