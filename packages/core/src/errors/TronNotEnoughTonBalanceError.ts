export class TronNotEnoughTonBalanceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TronNotEnoughTonBalanceError';
    }
}
