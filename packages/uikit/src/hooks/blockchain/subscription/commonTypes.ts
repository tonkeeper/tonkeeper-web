import { SubscriptionExtension } from '@tonkeeper/core/dist/pro';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';

export type CancelParams = {
    selectedWallet: TonWalletStandard;
    extensionContract: string;
    destroyValue: string;
};

export type SubscriptionEncodingParams = {
    selectedWallet: TonWalletStandard;
} & SubscriptionExtension;
