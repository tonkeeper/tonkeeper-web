import { AccountRepr, Fee } from '../tonApi';
import { Suggestion } from './suggestion';

export type Recipient = Suggestion | { address: string };

export interface RecipientData {
  address: Recipient;
  comment: string;
  done: boolean;
  toAccount: AccountRepr;
}

export interface AmountData {
  amount: string;
  jetton: string;
  max: boolean;
  done: boolean;
  fee: Fee;
}
