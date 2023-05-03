import BigNumber from 'bignumber.js';
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
  fiat?: BigNumber;
  amount: BigNumber;
  max: boolean;
}

export interface AmountData extends AmountValue {
  jetton: string;
  done: boolean;
  fee: Fee;
}
