import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { RecipientData } from '@tonkeeper/core/dist/entries/send';
import React, { FC, PropsWithChildren } from 'react';
import { useEstimateTransfer } from '../../hooks/blockchain/useEstimateTransfer';
import { useSendTransfer } from '../../hooks/blockchain/useSendTransfer';
import { ConfirmView } from './ConfirmView';

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
    const estimation = useEstimateTransfer(rest.recipient, rest.assetAmount, isMax);
    const mutation = useSendTransfer(rest.recipient, rest.assetAmount, isMax, estimation.data!);

    return <ConfirmView estimation={estimation} {...mutation} {...rest} />;
};
