import { LedgerMessageSender } from './ledger-message-sender';
import { BatteryMessageSender } from './battery-message-sender';
import { WalletMessageSender } from './wallet-message-sender';

export type Sender = WalletMessageSender | BatteryMessageSender | LedgerMessageSender;

export { WalletMessageSender, BatteryMessageSender, LedgerMessageSender };
