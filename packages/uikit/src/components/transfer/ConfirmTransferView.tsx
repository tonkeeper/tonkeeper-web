import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import React, { FC, PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useEstimateTransfer } from '../../hooks/blockchain/useEstimateTransfer';
import { useSendTransfer } from '../../hooks/blockchain/useSendTransfer';
import { ConfirmView } from './ConfirmView';
import {
    SenderTypeUserAvailable,
    useAvailableSendersChoices
} from '../../hooks/blockchain/useSender';
import {
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TON_ASSET, TON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useAssetWeiBalance } from '../../state/home';
import { JettonEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/jetton-encoder';
import BigNumber from 'bignumber.js';
import { RatesApi } from '@tonkeeper/core/dist/tonApiV2';
import { useAppContext } from '../../hooks/appContext';
import { isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { useQuery } from '@tanstack/react-query';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { useActiveApi } from '../../state/wallet';

const gaslessApproximateFee = (asset: TonAsset, tokenToTonRate: number) => {
    const k = asset.id === TON_USDT_ASSET.id ? 0.9 : 0.5;

    const relativeAmount = shiftedDecimals(
        new BigNumber(JettonEncoder.jettonTransferAmount.toString())
    )
        .multipliedBy(1.2)
        .div(k)
        .div(tokenToTonRate);

    return AssetAmount.fromRelativeAmount({ asset: asset, amount: relativeAmount });
};

export const ConfirmTransferView: FC<
    PropsWithChildren<{
        recipient: RecipientData;
        assetAmount: AssetAmount;
        isMax: boolean;
        onBack?: () => void;
        onClose: (confirmed?: boolean) => void;
        fitContent?: boolean;
    }>
> = ({ isMax, assetAmount, ...rest }) => {
    const api = useActiveApi();
    const operationType = useMemo(() => {
        return {
            type: 'transfer',
            asset: assetAmount.asset as TonAsset
        } as const;
    }, [assetAmount.asset]);
    const assetWeiBalance = useAssetWeiBalance(assetAmount.asset);
    /**
     * for MAX button jettons gasless
     */
    const [assetAmountPatched, setAssetAmountPatched] = useState<AssetAmount>(assetAmount);

    const { data: availableSendersChoices } = useAvailableSendersChoices(operationType);

    useEffect(() => {
        if (availableSendersChoices) {
            onSenderTypeChange(availableSendersChoices[0].type);
        }
    }, [availableSendersChoices]);

    const [selectedSenderType, onSenderTypeChange] = useState<SenderTypeUserAvailable>();

    const estimation = useEstimateTransfer({
        recipient: rest.recipient,
        amount: assetAmountPatched,
        isMax,
        senderType: selectedSenderType
    });
    const mutation = useSendTransfer({
        recipient: rest.recipient,
        amount: assetAmountPatched,
        isMax,
        estimation: estimation.data!,
        senderType: selectedSenderType!
    });

    const assetAddress = isTonAsset(assetAmount.asset)
        ? tonAssetAddressToString((assetAmount.asset as TonAsset).address)
        : undefined;
    const shouldPatchAmount =
        assetAddress !== TON_ASSET.address &&
        isMax &&
        selectedSenderType === 'gasless' &&
        isTonAsset(assetAmount.asset) &&
        assetWeiBalance;

    const tokenToTonRate = useQuery(
        [
            'current-token-to-ton-rate',
            tonAssetAddressToString((assetAmount.asset as TonAsset).address)
        ],
        async () => {
            const response = await new RatesApi(api.tonApiV2).getRates({
                tokens: [assetAddress!],
                currencies: ['TON']
            });

            return Object.values(response.rates)[0].prices!.TON;
        },
        {
            enabled: !!shouldPatchAmount
        }
    );

    useEffect(() => {
        if (!shouldPatchAmount) {
            return setAssetAmountPatched(assetAmount);
        }

        if (!tokenToTonRate.data) {
            return;
        }

        const fee = gaslessApproximateFee(assetAmount.asset as TonAsset, tokenToTonRate.data);
        setAssetAmountPatched(
            new AssetAmount({
                asset: assetAmount.asset,
                weiAmount: assetWeiBalance.minus(fee.weiAmount)
            })
        );
    }, [isMax, assetAmount, selectedSenderType, assetWeiBalance?.toFixed(0)]);

    return (
        <ConfirmView
            estimation={estimation}
            {...mutation}
            {...rest}
            assetAmount={assetAmountPatched}
            selectedSenderType={selectedSenderType}
            onSenderTypeChange={onSenderTypeChange}
            availableSendersChoices={availableSendersChoices}
        />
    );
};
