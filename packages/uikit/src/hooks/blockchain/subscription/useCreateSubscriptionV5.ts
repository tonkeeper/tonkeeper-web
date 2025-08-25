import { useMutation } from '@tanstack/react-query';
import { Address, Cell, toNano } from '@ton/core';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useActiveApi, useAccountsState } from '../../../state/wallet';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import {
    DeployPreview,
    SubscriptionV5Encoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { CellSigner } from '@tonkeeper/core/dist/entries/signer';
import { TonEstimation } from '@tonkeeper/core/dist/entries/send';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

interface ISubscriptionEncodingParams {
    fromWallet: WalletId;
    beneficiaryAddress: string;
    periodSecs: number;
    reserveTon: string;
    paymentPerPeriodTon: string;
    callerFeeTon: string;
}

export const useCreateSubscriptionV5 = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const wallets = useAccountsState()
        .filter(isAccountTonWalletStandard)
        .flatMap(account => account.allTonWallets.map(wallet => ({ wallet, account })));

    return useMutation<boolean, Error, ISubscriptionEncodingParams>(async subscriptionParams => {
        if (!subscriptionParams) throw new Error('No params');

        const accountAndWallet = wallets.find(w => w.wallet.id === subscriptionParams.fromWallet);

        if (!accountAndWallet) throw new Error('AccountAndWallet not found');

        const signer = await getSigner(sdk, accountAndWallet.account.id, {
            walletId: accountAndWallet.wallet.id
        }).catch(() => null);

        if (!signer) throw new Error('Signer not found');

        const beneficiary = Address.parse(subscriptionParams.beneficiaryAddress);

        const encoder = new SubscriptionV5Encoder();
        const { actions, extensionAddress } = encoder.encodeCreateSubscriptionV2({
            wallet: Address.parse(accountAndWallet.wallet.rawAddress),
            walletVersion: 51,
            beneficiary,
            subscriptionId: BigInt(Date.now()),
            firstChargingDate: 0,
            paymentPerPeriodNano: toNano(subscriptionParams.paymentPerPeriodTon),
            periodSecs: subscriptionParams.periodSecs,
            gracePeriodSecs: 10 * 60,
            callerFeeNano: toNano(subscriptionParams.callerFeeTon),
            withdrawAddress: beneficiary,
            withdrawMsgBody: Cell.EMPTY,
            metadata: Cell.EMPTY,
            reserveNano: toNano(subscriptionParams.reserveTon),
            sendMode: 3
        });

        const sender = new WalletMessageSender(api, accountAndWallet.wallet, signer as CellSigner);
        await sender.send(actions);

        await sdk.storage.set('EXT_ADDR', extensionAddress.toString());

        return true;
    });
};

export const useFakeFeeEstimation = () =>
    useMutation<TonEstimation, Error>(async () => ({
        fee: {
            type: 'ton-asset' as const,
            extra: new AssetAmount({ asset: TON_ASSET, weiAmount: 10_000 })
        }
    }));

export const useSubscriptionDataEmulation = () => {
    const wallets = useAccountsState()
        .filter(isAccountTonWalletStandard)
        .flatMap(account => account.allTonWallets.map(wallet => ({ wallet, account })));

    return useMutation<DeployPreview | null, Error, ISubscriptionEncodingParams>(
        async subscriptionParams => {
            if (!subscriptionParams) throw new Error('No params');

            const accountAndWallet = wallets.find(
                w => w.wallet.id === subscriptionParams.fromWallet
            );

            if (!accountAndWallet) throw new Error('AccountAndWallet not found');

            const beneficiary = Address.parse(subscriptionParams.beneficiaryAddress);

            const encoder = new SubscriptionV5Encoder();
            const { actions } = encoder.encodeCreateSubscriptionV2({
                wallet: Address.parse(accountAndWallet.wallet.rawAddress),
                walletVersion: 51,
                beneficiary,
                subscriptionId: BigInt(Date.now()),
                firstChargingDate: 0,
                paymentPerPeriodNano: toNano(subscriptionParams.paymentPerPeriodTon),
                periodSecs: subscriptionParams.periodSecs,
                gracePeriodSecs: 3 * 60,
                callerFeeNano: toNano(subscriptionParams.callerFeeTon),
                withdrawAddress: beneficiary,
                withdrawMsgBody: Cell.EMPTY,
                metadata: Cell.EMPTY,
                reserveNano: toNano(subscriptionParams.reserveTon),
                sendMode: 3
            });

            return encoder.extractDeployPreview(actions);
        }
    );
};
