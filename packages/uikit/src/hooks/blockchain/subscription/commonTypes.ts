import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';

export type CancelParams = {
    selectedWallet: TonWalletStandard;
    extensionContract: string;
    destroyValue: string;
};
