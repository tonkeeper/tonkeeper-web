import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TonRecipientData, TransferEstimationEventFee } from '@tonkeeper/core/dist/entries/send';
import React, { FC, PropsWithChildren, useEffect } from 'react';
import { ConfirmView, ConfirmViewAdditionalBottomSlot } from './ConfirmView';
import { useEstimateNewMultisigTransfer } from '../../hooks/blockchain/multisig/useEstimateNewMultisigTransfer';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useSendNewMultisigTransfer } from '../../hooks/blockchain/multisig/useSendNewMultisigTransfer';
import { MultisigOrderLifetimeMinutes } from '../../libs/multisig';
import { MultisigTransferDetails } from './multisig/MultisigTransferDetails';
import { useActiveMultisigAccountHost, useActiveMultisigWalletInfo } from '../../state/multisig';
import { styled } from 'styled-components';

const MultisigTransferDetailsStyled = styled(MultisigTransferDetails)`
    margin-bottom: 1rem;
`;

export const ConfirmMultisigNewTransferView: FC<
    PropsWithChildren<{
        recipient: TonRecipientData;
        assetAmount: AssetAmount<TonAsset>;
        isMax: boolean;
        ttl: MultisigOrderLifetimeMinutes;
        onBack?: () => void;
        onClose: (confirmed?: boolean) => void;
        fitContent?: boolean;
    }>
> = ({ isMax, ttl, ...rest }) => {
    const { signerWallet } = useActiveMultisigAccountHost();
    const { data: multisigInfo } = useActiveMultisigWalletInfo();
    const estimation = useEstimateNewMultisigTransfer(rest.recipient, rest.assetAmount, isMax);
    const mutation = useSendNewMultisigTransfer(
        rest.recipient,
        rest.assetAmount,
        isMax,
        ttl,
        estimation.data?.payload as TransferEstimationEventFee
    );

    useEffect(() => {
        estimation.mutate();
    }, [estimation.mutate]);

    return (
        <ConfirmView estimation={estimation} {...mutation} {...rest}>
            <ConfirmViewAdditionalBottomSlot>
                {multisigInfo ? (
                    <MultisigTransferDetailsStyled
                        status="progress"
                        signedWallets={[]}
                        threshold={multisigInfo.threshold}
                        pendingWallets={multisigInfo.signers}
                        hostAddress={signerWallet.rawAddress}
                        secondsLeft={Number(ttl) * 60}
                    />
                ) : null}
            </ConfirmViewAdditionalBottomSlot>
        </ConfirmView>
    );
};
