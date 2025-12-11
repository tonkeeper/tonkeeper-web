import { TranslatableError, TranslateFunction } from './TranslatableError';

export class NotEnoughHostWalletBalanceError extends Error implements TranslatableError {
    translate = (t: TranslateFunction) =>
        t('confirm_error_insufficient_host_wallet_balance', {
            wallet: this.hostWalletAddress
        });

    constructor(message: string, private readonly hostWalletAddress: string) {
        super(message);
        this.name = 'NotEnoughHostWalletBalanceError';
    }
}
