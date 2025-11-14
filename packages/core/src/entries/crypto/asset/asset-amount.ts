import BigNumber from 'bignumber.js';
import { AmountFormatter } from '../../../utils/AmountFormatter';
import { getDecimalSeparator, getGroupSeparator } from '../../../utils/formatting';
import { Asset } from './asset';
import { BasicAsset } from './basic-asset';
import { IAssetAmount } from './i-asset-amount';
import { toBigInt } from './utils';
import { ScaledUIMultiplier } from './scaled-ui';

type AssetAmountStruct<T extends BasicAsset> =
    | {
          asset: T;
          weiAmount: BigNumber.Value;
          image?: string;
      }
    | {
          asset: T;
          relativeAmount: BigNumber.Value;
          image?: string;
      };

const formatter = new AmountFormatter({
    getLocaleFormat: () => ({
        decimalSeparator: getDecimalSeparator(),
        groupingSeparator: getGroupSeparator()
    })
});

export class AssetAmount<T extends BasicAsset = Asset> implements IAssetAmount<T> {
    static fromRelativeAmount<T extends Asset = Asset>({
        asset,
        amount
    }: {
        asset: T;
        amount: BigNumber.Value;
    }): AssetAmount<T> {
        return new AssetAmount({
            asset,
            relativeAmount: amount
        });
    }

    private static toScalingUIAmount(
        amount: BigNumber.Value,
        scaledUIMultiplier: ScaledUIMultiplier | { numerator: string; denominator: string }
    ): bigint {
        return (
            (toBigInt(amount) * toBigInt(scaledUIMultiplier.numerator)) /
            toBigInt(scaledUIMultiplier.denominator)
        );
    }

    private static fromScalingUIAmount(
        scaledUIAmount: BigNumber.Value,
        scaledUIMultiplier: ScaledUIMultiplier | { numerator: string; denominator: string }
    ): bigint {
        return (
            (toBigInt(scaledUIAmount) * toBigInt(scaledUIMultiplier.denominator)) /
            toBigInt(scaledUIMultiplier.numerator)
        );
    }

    public readonly weiAmount: BigNumber;

    public readonly relativeAmount: BigNumber;

    public readonly asset: T;

    public readonly image: string | undefined;

    get stringAsset(): string {
        return this.asset.symbol;
    }

    get stringRelativeAmount(): string {
        return this.toStringRelativeAmount();
    }

    get stringAssetRelativeAmount(): string {
        return this.toStringAssetRelativeAmount();
    }

    get stringAssetAbsoluteRelativeAmount(): string {
        return this.toStringAssetAbsoluteRelativeAmount();
    }

    get stringWeiAmount(): string {
        return this.weiAmount.toFixed(0);
    }

    constructor(params: AssetAmountStruct<T>) {
        this.asset = params.asset;
        this.image = params.image || params.asset.image;

        if ('weiAmount' in params) {
            this.weiAmount = new BigNumber(params.weiAmount);
            this.relativeAmount = new BigNumber(
                AssetAmount.toScalingUIAmount(
                    this.weiAmount,
                    this.asset.scaledUIMultiplier
                ).toString()
            ).div(10 ** this.asset.decimals);
        } else {
            this.relativeAmount = new BigNumber(params.relativeAmount);
            this.weiAmount = new BigNumber(
                AssetAmount.fromScalingUIAmount(
                    new BigNumber(params.relativeAmount).multipliedBy(10 ** params.asset.decimals),
                    params.asset.scaledUIMultiplier
                ).toString()
            );
        }
    }

    public isEQ(assetAmount: IAssetAmount): boolean {
        this.checkIfCanCompareCurrencies(assetAmount);
        return this.weiAmount.eq(assetAmount.weiAmount);
    }

    isGT(assetAmount: IAssetAmount): boolean {
        this.checkIfCanCompareCurrencies(assetAmount);
        return this.weiAmount.gt(assetAmount.weiAmount);
    }

    isGTE(assetAmount: IAssetAmount): boolean {
        this.checkIfCanCompareCurrencies(assetAmount);
        return this.weiAmount.gte(assetAmount.weiAmount);
    }

    isLT(assetAmount: IAssetAmount): boolean {
        this.checkIfCanCompareCurrencies(assetAmount);
        return this.weiAmount.lt(assetAmount.weiAmount);
    }

    isLTE(assetAmount: IAssetAmount): boolean {
        this.checkIfCanCompareCurrencies(assetAmount);
        return this.weiAmount.lte(assetAmount.weiAmount);
    }

    toStringRelativeAmount(decimalPlaces?: number): string {
        if (decimalPlaces === undefined) {
            decimalPlaces = this.asset.decimals;
        }
        return formatter.format(this.relativeAmount, { decimals: decimalPlaces });
    }

    toStringAssetRelativeAmount(decimalPlaces?: number): string {
        return `${this.toStringRelativeAmount(decimalPlaces)} ${this.stringAsset}`;
    }

    toStringAbsoluteRelativeAmount(decimalPlaces?: number): string {
        if (decimalPlaces === undefined) {
            decimalPlaces = this.asset.decimals;
        }
        return formatter.format(this.relativeAmount.abs(), { decimals: decimalPlaces });
    }

    toStringAssetAbsoluteRelativeAmount(decimalPlaces?: number): string {
        return `${this.toStringAbsoluteRelativeAmount(decimalPlaces)} ${this.stringAsset}`;
    }

    protected checkIfCanCompareCurrencies(assetAmount: IAssetAmount): never | void {
        if (assetAmount.asset.id !== this.asset.id) {
            throw new Error(
                `Can't compare ${this.asset.id} and ${assetAmount.asset.id} amounts because they have different currencies types.`
            );
        }
    }
}
