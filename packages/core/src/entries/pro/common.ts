import { APIConfig } from '../apis';
import { RecipientData } from '../send';
import { TonWalletStandard } from '../wallet';
import { InvoicesInvoice } from '../../tonConsoleApi';
import { AssetAmount } from '../crypto/asset/asset-amount';
import { AuthTypes, IosEnvironmentTypes, ProductIds, PurchaseStatuses } from './enums';

export interface IProStateWallet {
    publicKey: string;
    rawAddress: string;
}

export interface IDisplayPlan {
    id: string;
    displayName: string;
    displayPrice: string;
    subscriptionPeriod?: string;
    formattedDisplayPrice: string;
}

export interface IProductInfo {
    id: ProductIds;
    displayName: string;
    description: string;
    displayPrice: string;
    subscriptionGroup: string;
    subscriptionPeriod: string;
    environment: IosEnvironmentTypes;
}

export interface IIosPurchaseResult {
    status: PurchaseStatuses;
    productId: ProductIds;
    isUpgraded: boolean;
    purchaseDate: string;
    expirationDate: string;
    revocationDate: string | null;
    originalTransactionId?: number;
    environment: IosEnvironmentTypes;
}

export interface IOriginalTransactionInfo {
    originalTransactionId: number | string | null;
    productId?: ProductIds;
    purchaseDate?: string;
    environment: IosEnvironmentTypes;
}

export interface IConfirmState {
    invoice: InvoicesInvoice;
    recipient: RecipientData;
    assetAmount: AssetAmount;
    wallet: TonWalletStandard;
}

export interface ISubscriptionFormData {
    wallet?: IProStateWallet;
    tempToken: string;
    promoCode?: string;
    selectedPlan: IDisplayPlan;
}

export interface ICryptoStrategyConfig {
    api: APIConfig;
    onProConfirmOpen: (p?: {
        confirmState: IConfirmState | null;
        onConfirm?: (success?: boolean) => void;
        onCancel?: () => void;
    }) => void;
}

export interface IWalletAuth {
    type: AuthTypes.WALLET;
    wallet: IProStateWallet;
}

export interface ITokenizedWalletAuth extends IWalletAuth {
    tempToken: string;
}

export interface ITelegramAuth {
    type: AuthTypes.TELEGRAM;
}

export type NormalizedProPlans = {
    plans: IDisplayPlan[] | undefined;
    verifiedPromoCode: string | undefined;
};

export interface ISupportData {
    url: string;
    isPriority: boolean;
}
