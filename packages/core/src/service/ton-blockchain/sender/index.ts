import { LedgerMessageSender } from './ledger-message-sender';
import { BatteryMessageSender } from './battery-message-sender';
import { WalletMessageSender } from './wallet-message-sender';
import { MultisigCreateOrderSender } from './multisig-create-order-sender';
import { GaslessMessageSender } from './gasless-message-sender';
import { TwoFAMessageSender } from './two-fa-message-sender';

export type Sender =
    | WalletMessageSender
    | BatteryMessageSender
    | LedgerMessageSender
    | MultisigCreateOrderSender
    | GaslessMessageSender
    | TwoFAMessageSender;

export {
    WalletMessageSender,
    BatteryMessageSender,
    LedgerMessageSender,
    MultisigCreateOrderSender,
    GaslessMessageSender
};

export type { ISender } from './ISender';
