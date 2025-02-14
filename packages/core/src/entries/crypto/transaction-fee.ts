import { AssetAmount } from './asset/asset-amount';
import { TonAsset } from './asset/ton-asset';

export type TransactionFee = TransactionFeeTonAsset | TransactionFeeBattery;

export type TransactionFeeTonAsset = {
    type: 'ton-asset';
    extra: AssetAmount<TonAsset>;
};

export type TransactionFeeBattery = {
    type: 'battery';
    charges: number;
};

export function isTransactionFeeRefund(fee?: TransactionFee): boolean {
    return fee?.type === 'ton-asset' && fee.extra.weiAmount.lt(0);
}
