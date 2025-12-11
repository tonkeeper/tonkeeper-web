import { TranslatableError } from './TranslatableError';

export class NotEnoughBatteryBalanceError extends Error implements TranslatableError {
    public translate = 'confirm_error_insufficient_battery_balance';

    constructor(message: string) {
        super(message);
        this.name = 'NotEnoughBatteryBalanceError';
    }
}
