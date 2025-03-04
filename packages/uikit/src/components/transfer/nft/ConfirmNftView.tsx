import { useMutation, useQuery } from '@tanstack/react-query';

import { NftItem } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../../hooks/appContext';
import { useTranslation } from '../../../hooks/translation';
import { Gap } from '../../Layout';
import { ListBlock } from '../../List';
import { FullHeightBlock } from '../../Notification';

import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonEstimation, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { useTransactionAnalytics } from '../../../hooks/amplitude';
import { QueryKey } from '../../../libs/queryKey';
import { Image, ImageMock, Info, SendingTitle, Title } from '../Confirm';
import {
    ConfirmViewContext,
    ConfirmViewDetailsComment,
    ConfirmViewDetailsFee,
    ConfirmViewDetailsRecipient
} from '../ConfirmView';
import { NftDetailsBlock } from './Common';
import {
    useAccountsState,
    useActiveAccount,
    useInvalidateActiveWalletQueries
} from '../../../state/wallet';
import {
    useActiveMultisigAccountHost,
    useActiveMultisigWalletInfo,
    useIsActiveAccountMultisig
} from '../../../state/multisig';
import { MultisigOrderLifetimeMinutes } from '../../../libs/multisig';
import { MultisigTransferDetails } from '../multisig/MultisigTransferDetails';
import { styled } from 'styled-components';
import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    SenderTypeUserAvailable,
    useAvailableSendersChoices,
    useGetEstimationSender,
    useGetSender
} from '../../../hooks/blockchain/useSender';
import { useTonRawTransactionService } from '../../../hooks/blockchain/useBlockchainService';
import { NFTEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/nft-encoder';
import BigNumber from 'bignumber.js';
import { comment } from '@ton/core';
import { useNotifyErrorHandle } from '../../../hooks/useNotification';
import { zeroFeeEstimation } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { useToQueryKeyPart } from '../../../hooks/useToQueryKeyPart';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TransactionFee } from "@tonkeeper/core/dist/entries/crypto/transaction-fee";

const assetAmount = new AssetAmount({
    asset: TON_ASSET,
    weiAmount: 0
});

const useNftTransferEstimation = (
    nftItem: NftItem,
    data: TonRecipientData,
    selectedSenderType: SenderTypeUserAvailable | undefined
) => {
    const account = useActiveAccount();
    const accounts = useAccountsState();
    const notifyError = useNotifyErrorHandle();

    const senderChoice = useMemo(() => {
        if (!selectedSenderType) {
            return undefined;
        }

        if (account.type === 'ton-multisig') {
            return { type: 'multisig', ttlSeconds: 5 * 60 } as const;
        }
        if (selectedSenderType === 'external') {
            return EXTERNAL_SENDER_CHOICE;
        }

        if (selectedSenderType === 'battery') {
            return BATTERY_SENDER_CHOICE;
        }

        throw new Error(`Unsupported sender type for nft transfer ${selectedSenderType}`);
    }, [selectedSenderType, account]);

    const getSender = useGetEstimationSender(senderChoice);
    const getSenderKey = useToQueryKeyPart(getSender);
    const rawTransactionService = useTonRawTransactionService();

    return useQuery<TonEstimation, Error>(
        [QueryKey.estimate, data?.address, accounts, getSenderKey],
        async () => {
            try {
                if (account.type === 'watch-only') {
                    throw new Error('account not controllable');
                }

                const nftEncoder = new NFTEncoder(account.activeTonWallet.rawAddress);
                const sender = await getSender!();
                const nftTransferMsg = nftEncoder.encodeNftTransfer({
                    nftAddress: nftItem.address,
                    recipientAddress: data!.address.address,
                    forwardPayload: data!.comment ? comment(data.comment) : null,
                    responseAddress:
                        'excessAddress' in sender && sender.excessAddress
                            ? sender.excessAddress
                            : undefined
                });

                return await rawTransactionService.estimate(sender, nftTransferMsg);
            } catch (e) {
                await notifyError(e);
                throw e;
            }
        },
        { enabled: data != null && !!getSender && senderChoice !== undefined }
    );
};

const useSendNft = (
    recipient: TonRecipientData,
    nftItem: NftItem,
    fee: TransactionFee | undefined,
    options: {
        multisigTTL?: MultisigOrderLifetimeMinutes;
        selectedSenderType: SenderTypeUserAvailable;
    }
) => {
    const account = useActiveAccount();
    const track2 = useTransactionAnalytics();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    const getSender = useGetSender();
    const rawTransactionService = useTonRawTransactionService();
    const notifyError = useNotifyErrorHandle();

    return useMutation<boolean, Error>(async () => {
        if (account.type === 'watch-only') {
            console.error("Can't send a transfer using this account");
            return false;
        }

        if (!fee) return false;

        if (fee.type !== 'ton-asset' || fee.extra.asset.id !== TON_ASSET.id) {
            throw new Error(`Unexpected fee ${fee}`);
        }

        try {
            let senderChoice;
            if (account.type === 'ton-multisig') {
                if (options.multisigTTL === undefined) {
                    throw new Error('TTL must be specified for multisig sending');
                }
                senderChoice = {
                    type: 'multisig',
                    ttlSeconds: 60 * Number(options.multisigTTL)
                } as const;
            } else if (options.selectedSenderType === 'external') {
                senderChoice = EXTERNAL_SENDER_CHOICE;
            } else if (options.selectedSenderType === 'battery') {
                senderChoice = BATTERY_SENDER_CHOICE;
            } else {
                throw new Error(
                    `Unsupported sender type for nft transfer ${options.selectedSenderType}`
                );
            }

            const sender = await getSender(senderChoice);

            const nftEncoder = new NFTEncoder(account.activeTonWallet.rawAddress);
            const nftTransferAmountWei = new BigNumber(NFTEncoder.nftTransferBase.toString()).plus(
                fee.extra.weiAmount
            );
            const nftTransferMsg = nftEncoder.encodeNftTransfer({
                nftAddress: nftItem.address,
                recipientAddress: recipient.address.address,
                forwardPayload: recipient.comment ? comment(recipient.comment) : null,
                nftTransferAmountWei,
                responseAddress:
                    'excessAddress' in sender && sender.excessAddress
                        ? sender.excessAddress
                        : undefined
            });

            await rawTransactionService.send(sender, zeroFeeEstimation, nftTransferMsg);
            track2('send-nft');
        } catch (e) {
            await notifyError(e);
        }

        await invalidateAccountQueries();
        return true;
    });
};

const operationTypeSendNFT = { type: 'nfr_transfer' } as const;

export const ConfirmNftView: FC<{
    recipient: TonRecipientData;
    nftItem: NftItem;
    onClose: () => void;
    headerBlock: ReactNode;
    mainButton: ReactNode;
    multisigTTL?: MultisigOrderLifetimeMinutes;
}> = ({ recipient, onClose, nftItem, headerBlock, mainButton, multisigTTL }) => {
    const { standalone } = useAppContext();
    const [done, setDone] = useState(false);
    const { t } = useTranslation();
    const isActiveMultisig = useIsActiveAccountMultisig();

    const { data: availableSendersChoices } = useAvailableSendersChoices(operationTypeSendNFT);
    const [selectedSenderType, onSenderTypeChange] = useState<
        SenderTypeUserAvailable | undefined
    >();
    useEffect(() => {
        if (availableSendersChoices) {
            onSenderTypeChange(availableSendersChoices[0].type);
        }
    }, [availableSendersChoices]);

    const estimation = useNftTransferEstimation(nftItem, recipient, selectedSenderType);
    const { mutateAsync, isLoading, error, reset } = useSendNft(
        recipient,
        nftItem,
        estimation.data?.fee,
        { multisigTTL, selectedSenderType: selectedSenderType! }
    );

    const image = nftItem.previews?.find(item => item.resolution === '100x100');

    const handleSubmit = async () => {
        if (isLoading) return false;
        try {
            reset();
            const isDone = await mutateAsync();
            if (isDone) {
                setDone(true);
                setTimeout(onClose, 2000);
            }
            return isDone;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.stopPropagation();
        e.preventDefault();
    };

    return (
        <ConfirmViewContext.Provider
            value={{
                recipient,
                assetAmount,
                estimation,
                formState: { done, isLoading, error },
                onClose: () => onClose(),
                onBack: () => {},
                handleSubmit
            }}
        >
            <FullHeightBlock onSubmit={onSubmit} standalone={standalone}>
                {headerBlock}
                <Info>
                    {image ? <Image src={image.url} /> : <ImageMock />}
                    <SendingTitle>{nftItem.dns ?? nftItem.metadata.name}</SendingTitle>
                    <Title>{t('txActions_signRaw_types_nftItemTransfer')}</Title>
                </Info>
                <ListBlock margin={false} fullWidth>
                    <ConfirmViewDetailsRecipient />
                    <ConfirmViewDetailsFee
                        availableSendersChoices={availableSendersChoices}
                        selectedSenderType={selectedSenderType}
                        onSenderTypeChange={onSenderTypeChange}
                    />
                    <ConfirmViewDetailsComment />
                </ListBlock>

                <NftDetailsBlock nftItem={nftItem} />

                <Gap />
                {isActiveMultisig && multisigTTL ? (
                    <MayBeMultisigDetalis ttl={multisigTTL} />
                ) : null}
                {mainButton}
            </FullHeightBlock>
        </ConfirmViewContext.Provider>
    );
};

const MultisigTransferDetailsStyled = styled(MultisigTransferDetails)`
    margin-bottom: 1rem;
`;

const MayBeMultisigDetalis: FC<{ ttl: MultisigOrderLifetimeMinutes }> = ({ ttl }) => {
    const { data: multisigInfo } = useActiveMultisigWalletInfo();
    const { signerWallet } = useActiveMultisigAccountHost();

    if (!multisigInfo) {
        return null;
    }

    return (
        <MultisigTransferDetailsStyled
            status="progress"
            signedWallets={[]}
            threshold={multisigInfo.threshold}
            pendingWallets={multisigInfo.signers}
            hostAddress={signerWallet.rawAddress}
            secondsLeft={Number(ttl) * 60}
        />
    );
};
