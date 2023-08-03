import BigNumber from 'bignumber.js';
import { AccountRepr, Fee, WalletDNS } from '../tonApiV1';
import { Suggestion } from './suggestion';
import { BLOCKCHAIN_NAME } from './crypto';

export type BaseRecipient = Suggestion | { address: string };

export type DnsRecipient = BaseRecipient & {
    dns: WalletDNS;
};

export type TonRecipient = (BaseRecipient | DnsRecipient) & { blockchain: BLOCKCHAIN_NAME.TON };
export type TronRecipient = BaseRecipient & { blockchain: BLOCKCHAIN_NAME.TRON };
export type Recipient = TonRecipient | TronRecipient;

export interface TonRecipientData {
    address: TonRecipient;
    comment: string;
    done: boolean;
    toAccount: AccountRepr;
}

export interface TronRecipientData {
    address: TronRecipient;
    done: boolean;
}

export type RecipientData = TonRecipientData | TronRecipientData;

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
