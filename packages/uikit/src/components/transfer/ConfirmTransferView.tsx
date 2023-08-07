import { RecipientData } from '@tonkeeper/core/dist/entries/send';

import React, { FC, PropsWithChildren } from 'react';
import { useSendTransfer } from '../../hooks/blockchain/useSendTransfer';
import { useEstimateTransfer } from '../../hooks/blockchain/useEstimateTransfer';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useWalletJettonList } from '../../state/wallet';
import { useUserJettonList } from '../../state/jetton';
import { ConfirmView } from './ConfirmView';
import { DefaultRefetchInterval } from '../../state/tonendpoint';

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
    const { data: notFilteredJettons } = useWalletJettonList();
    const jettons = useUserJettonList(notFilteredJettons);

    const mutation = useSendTransfer(rest.recipient, rest.assetAmount, jettons); // TODO

    const estimation = useEstimateTransfer(rest.recipient, isMax, rest.assetAmount, {
        refetchInterval: DefaultRefetchInterval,
        refetchOnMount: 'always'
    });

    return <ConfirmView estimation={estimation} {...mutation} {...rest} />;
};
