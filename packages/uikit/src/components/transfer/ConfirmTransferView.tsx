import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import React, { FC, PropsWithChildren, useEffect, useState } from 'react';
import { useEstimateTransfer } from '../../hooks/blockchain/useEstimateTransfer';
import { useSendTransfer } from '../../hooks/blockchain/useSendTransfer';
import { ConfirmView } from './ConfirmView';
import { useAvailableSendersTypes } from '../../hooks/blockchain/useSender';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

export const ConfirmTransferView: FC<
    PropsWithChildren<{
        recipient: RecipientData;
        assetAmount: AssetAmount;
        isMax: boolean;
        onBack?: () => void;
        onClose: (confirmed?: boolean) => void;
        fitContent?: boolean;
    }>
> = ({ isMax, ...rest }) => {
    const availableSenders = useAvailableSendersTypes({
        type: 'transfer',
        asset: rest.assetAmount.asset as TonAsset
    });

    useEffect(() => {
        onSenderTypeChange(availableSenders[0]);
    }, [availableSenders]);

    const [selectedSenderType, onSenderTypeChange] = useState(availableSenders[0]);

    const estimation = useEstimateTransfer({
        recipient: rest.recipient,
        amount: rest.assetAmount,
        isMax,
        senderType: selectedSenderType
    });
    const mutation = useSendTransfer({
        recipient: rest.recipient,
        amount: rest.assetAmount,
        isMax,
        estimation: estimation.data!,
        senderType: selectedSenderType
    });

    return (
        <ConfirmView
            estimation={estimation}
            {...mutation}
            {...rest}
            selectedSenderType={selectedSenderType}
            onSenderTypeChange={onSenderTypeChange}
            availableSenders={availableSenders}
        />
    );
};
