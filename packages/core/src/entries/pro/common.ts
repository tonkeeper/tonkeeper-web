import { RecipientData } from '../send';
import { TonWalletStandard } from '../wallet';
import { InvoicesInvoice } from '../../tonConsoleApi';
import { AssetAmount } from '../crypto/asset/asset-amount';
import { AuthTypes, IosEnvironmentTypes, ProductIds, PurchaseStatuses } from './enums';
import { SubscriptionExtension, SubscriptionSource } from '../../pro';
import { SubscriptionStrategy } from './subscription';
import { Language } from '../language';

export interface IDisplayPlan {
    id: string;
    displayName: string;
    displayPrice: string;
    subscriptionPeriod: string;
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
    wallet: TonWalletStandard;
    tempToken: string;
    selectedPlan: IDisplayPlan;
}

export interface IExtensionStrategyConfig {
    lang: Language;
    onDataStore: <R>(key: string, value: R) => Promise<R | null>;
    onProConfirmOpen: (p?: {
        extensionData?: SubscriptionExtension;
        onConfirm?: (success?: boolean) => void;
        onCancel?: () => void;
    }) => void;
    onRemoveExtensionConfirmOpen: (p?: {
        extensionContract?: string;
        onConfirm?: (success?: boolean) => void;
        onCancel?: () => void;
    }) => void;
}

export interface ISubscriptionServiceConfig {
    initialStrategyMap?: Map<SubscriptionSource, SubscriptionStrategy>;
}
export interface IWalletAuth {
    type: AuthTypes.WALLET;
    wallet: TonWalletStandard;
}

export interface ITokenizedWalletAuth extends IWalletAuth {
    tempToken: string;
}

export interface ITelegramAuth {
    type: AuthTypes.TELEGRAM;
}

export interface ISupportData {
    url: string;
    isPriority: boolean;
}

export interface IUserInfo {
    pub_key?: string;
    version?: string;
    user_id?: number;
    tg_id?: number;
}
