import { Account, AccountEvent, WalletDNS } from '../tonApiV2';
import { BLOCKCHAIN_NAME } from './crypto';
import { TonAsset } from './crypto/asset/ton-asset';
import { TronAsset } from './crypto/asset/tron-asset';
import { Suggestion } from './suggestion';
import { Asset } from './crypto/asset/asset';
import BigNumber from 'bignumber.js';
import { TON_ASSET } from './crypto/asset/constants';
import { TransactionFeeBattery, TransactionFeeTonAsset } from './crypto/transaction-fee';
import { TronResources } from '../tronApi';

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

export type TonEstimation = {
    /**
     * positive if fee
     * negative if there will be a refund
     */
    fee: TransactionFeeTonAsset | TransactionFeeBattery;
    event?: AccountEvent;
};

export function getTonEstimationTonFee(estimation: TonEstimation | undefined): BigNumber {
    if (estimation?.fee.type !== 'ton-asset') {
        return new BigNumber(0);
    }

    if (estimation.fee.extra.asset.id === TON_ASSET.id && estimation.fee.extra.weiAmount.gte(0)) {
        return estimation.fee.extra.weiAmount;
    }

    return new BigNumber(0);
}

export type TonEstimationDetailed = Required<TonEstimation>;

export const isTonEstimationDetailed = (
    estimation: TonEstimation
): estimation is TonEstimationDetailed => {
    return estimation.event !== undefined;
};

export type TronEstimation = {
    fee: TransactionFeeBattery;
    resources: TronResources;
};

export type Estimation<T extends Asset = Asset> = T extends TonAsset
    ? TonEstimation
    : T extends TronAsset
    ? TronEstimation
    : TonAsset | TronAsset;
