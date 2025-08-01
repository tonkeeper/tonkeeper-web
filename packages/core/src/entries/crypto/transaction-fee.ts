import { AssetAmount } from './asset/asset-amount';
import { TonAsset } from './asset/ton-asset';
import { TronAsset } from './asset/tron-asset';

export type TransactionFee = TonTransactionFee | TronTransactionFee;

export type TonTransactionFee = TransactionFeeTonAsset | TransactionFeeBattery;
export type TronTransactionFee =
    | TransactionFeeTronAsset
    | TransactionFeeBattery
    | TransactionFeeTonAssetRelayed;

export type TransactionFeeTonAsset = {
    type: 'ton-asset';
    extra: AssetAmount<TonAsset>;
};

export type TransactionFeeBattery = {
    type: 'battery';
    charges: number;
};

export type TransactionFeeTronAsset = {
    type: 'tron-asset';
    extra: AssetAmount<TronAsset>;
};

export type TransactionFeeTonAssetRelayed = {
    type: 'ton-asset-relayed';
    extra: AssetAmount<TonAsset>;
    sendToAddress: string;
};

export function isTransactionFeeRefund(fee?: TransactionFee): boolean {
    return fee?.type === 'ton-asset' && fee.extra.weiAmount.lt(0);
}
