export class NotEnoughBatteryBalanceError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotEnoughBatteryBalanceError';
    }
}
