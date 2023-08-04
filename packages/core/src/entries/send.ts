import BigNumber from 'bignumber.js';
import { AccountRepr, Fee, WalletDNS } from '../tonApiV1';
import { Suggestion } from './suggestion';
import { BLOCKCHAIN_NAME } from './crypto';
import { AssetAmount } from './crypto/asset/asset-amount';
import { Asset } from './crypto/asset/asset';

export type BaseRecipient = Suggestion | { address: string };

export type DnsRecipient = BaseRecipient & {
    dns: WalletDNS;
};

export type TonRecipient = (BaseRecipient | DnsRecipient) & { blockchain: BLOCKCHAIN_NAME.TON };
export type TronRecipient = BaseRecipient & { blockchain: BLOCKCHAIN_NAME.TRON };
export type Recipient = TonRecipient | TronRecipient;

export function isTonRecipient(recipient: Recipient): recipient is TonRecipient {
    return recipient.blockchain === BLOCKCHAIN_NAME.TON;
}

export function isTronRecipient(recipient: Recipient): recipient is TronRecipient {
    return recipient.blockchain === BLOCKCHAIN_NAME.TRON;
}

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

export function isTonRecipientData(
    recipientData: RecipientData
): recipientData is TonRecipientData {
    return isTonRecipient(recipientData.address);
}

export function isTronRecipientData(
    recipientData: RecipientData
): recipientData is TronRecipientData {
    return isTronRecipient(recipientData.address);
}

// @deprecated
export interface AmountValue {
    fiat?: BigNumber;
    amount: BigNumber;
    max: boolean;
}

// @deprecated
export interface AmountData extends AmountValue {
    jetton: string;
    done: boolean;
    fee: Fee;
}

export interface InputAssetAmount<T extends Asset = Asset> {
    assetAmount: AssetAmount<T>;
    isMax: boolean;
}
