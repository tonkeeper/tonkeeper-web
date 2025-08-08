import { APIConfig } from '../apis';
import { IAppSdk } from '../../AppSdk';
import { RecipientData } from '../send';
import { TonWalletStandard } from '../wallet';
import { InvoicesInvoice } from '../../tonConsoleApi';
import { AssetAmount } from '../crypto/asset/asset-amount';
import { ProAuthTokenService } from '../../service/proService';
import { AuthTypes, IosEnvironmentTypes, ProductIds, PurchaseStatuses } from './enums';

export interface ProStateWallet {
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

export interface ConfirmState {
    invoice: InvoicesInvoice;
    recipient: RecipientData;
    assetAmount: AssetAmount;
    wallet: TonWalletStandard;
}

export interface ISubscriptionFormData {
    selectedPlan: IDisplayPlan;
    promoCode?: string;
}

export interface ISubscriptionConfig {
    sdk?: IAppSdk;
    api?: APIConfig;
    authService?: ProAuthTokenService;
    onOpen?: (p?: {
        confirmState: ConfirmState | null;
        onConfirm?: (success?: boolean) => void;
        onCancel?: () => void;
    }) => void;
    wallet?: ProStateWallet | null;
}

export interface WalletAuth {
    type: AuthTypes.WALLET;
    wallet: ProStateWallet;
}

export interface TelegramAuth {
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
