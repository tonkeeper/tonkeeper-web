import { AccountRepr, Fee, WalletDNS } from '../tonApiV1';
import { Suggestion } from './suggestion';

export type DnsRecipient = {
  address: string;
  dns: WalletDNS;
};

export type Recipient = Suggestion | { address: string } | DnsRecipient;

export interface RecipientData {
  address: Recipient;
  comment: string;
  done: boolean;
  toAccount: AccountRepr;
}

export interface AmountValue {
  amount: string;
  max: boolean;
}

export interface AmountData extends AmountValue {
  amount: string;
  jetton: string;
  max: boolean;
  done: boolean;
  fee: Fee;
}
