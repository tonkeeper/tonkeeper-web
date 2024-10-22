import { LedgerMessageSender } from './ledger-message-sender';
import { BatteryMessageSender } from './battery-message-sender';
import { WalletMessageSender } from './wallet-message-sender';
import { MultisigCreateOrderSender } from './multisig-create-order-sender';

export type Sender =
    | WalletMessageSender
    | BatteryMessageSender
    | LedgerMessageSender
    | MultisigCreateOrderSender;

export {
    WalletMessageSender,
    BatteryMessageSender,
    LedgerMessageSender,
    MultisigCreateOrderSender
};

export type { ISender } from './ISender';
