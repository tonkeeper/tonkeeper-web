import { Account, AccountEvent, WalletDNS } from '../tonApiV2';
import { EstimatePayload } from '../tronApi';
import { BLOCKCHAIN_NAME } from './crypto';
import { Asset } from './crypto/asset/asset';
import { AssetAmount } from './crypto/asset/asset-amount';
import { TonAsset } from './crypto/asset/ton-asset';
import { TronAsset } from './crypto/asset/tron-asset';
import { Suggestion } from './suggestion';

export type BaseRecipient = Suggestion | { address: string; bounce?: boolean };

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
    toAccount: Account;
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

export type TransferEstimation<T extends Asset = Asset> = {
    fee: AssetAmount<T>;
    payload: T extends TonAsset
        ? TransferEstimationEvent
        : T extends TronAsset
        ? EstimatePayload
        : never;
};

export type TransferEstimationEvent = { event: AccountEvent };
