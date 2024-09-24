import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    estimateMultisigNFTTransfer,
    estimateNftTransfer,
    sendMultisigNFTTransfer,
    sendNftTransfer
} from '@tonkeeper/core/dist/service/transfer/nftService';
import { Multisig, MultisigApi, NftItem } from '@tonkeeper/core/dist/tonApiV2';
import React, { FC, ReactNode, useState } from 'react';
import { useAppContext } from '../../../hooks/appContext';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { Gap } from '../../Layout';
import { ListBlock } from '../../List';
import { FullHeightBlock } from '../../Notification';
import { notifyError } from '../common';

import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    TonRecipientData,
    TransferEstimation,
    TransferEstimationEvent
} from '@tonkeeper/core/dist/entries/send';
import { useTransactionAnalytics } from '../../../hooks/amplitude';
import { QueryKey } from '../../../libs/queryKey';
import { getSigner } from '../../../state/mnemonic';
import { useCheckTouchId } from '../../../state/password';
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
    getMultisigSignerInfo,
    useActiveMultisigAccountHost,
    useActiveMultisigWalletInfo,
    useIsActiveAccountMultisig
} from '../../../state/multisig';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { MultisigOrderLifetimeMinutes } from '../../../libs/multisig';
import { MultisigTransferDetails } from '../multisig/MultisigTransferDetails';
import { styled } from 'styled-components';

const assetAmount = new AssetAmount({
    asset: TON_ASSET,
    weiAmount: 0
});

const useNftTransferEstimation = (nftItem: NftItem, data?: TonRecipientData) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const account = useActiveAccount();
    const accounts = useAccountsState();
    const client = useQueryClient();

    let signerWallet: TonWalletStandard | null = null;
    if (account.type === 'ton-multisig') {
        signerWallet = getMultisigSignerInfo(accounts, account).signerWallet;
    }

    return useQuery<TransferEstimation<TonAsset>, Error>(
        [QueryKey.estimate, data?.address, accounts, signerWallet],
        async () => {
            try {
                if (account.type === 'watch-only') {
                    throw new Error('account not controllable');
                }

                let payload: TransferEstimationEvent;
                if (account.type === 'ton-multisig') {
                    let multisig = client.getQueryData([
                        QueryKey.multisigWallet,
                        account.activeTonWallet.rawAddress
                    ]) as Multisig | null;
                    if (!multisig) {
                        multisig = await new MultisigApi(api.tonApiV2).getMultisigAccount({
                            accountId: account.activeTonWallet.rawAddress
                        });
                    }

                    payload = await estimateMultisigNFTTransfer({
                        api,
                        multisig,
                        hostWallet: signerWallet!,
                        recipient: data!,
                        nftAddress: nftItem.address
                    });
                } else {
                    payload = await estimateNftTransfer(
                        api,
                        account.activeTonWallet,
                        data!,
                        nftItem
                    );
                }

                const fee = new AssetAmount({
                    asset: TON_ASSET,
                    weiAmount: payload.event.extra * -1
                });
                return { fee, payload };
            } catch (e) {
                await notifyError(client, sdk, t, e);
                throw e;
            }
        },
        { enabled: data != null }
    );
};

const useSendNft = (
    recipient: TonRecipientData,
    nftItem: NftItem,
    fee?: TransferEstimationEvent,
    options?: {
        multisigTTL?: MultisigOrderLifetimeMinutes;
    }
) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const account = useActiveAccount();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();
    const accounts = useAccountsState();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<boolean, Error>(async () => {
        if (account.type === 'watch-only') {
            console.error("Can't send a transfer using this account");
            return false;
        }

        if (!fee) return false;

        track2('send-nft');
        try {
            if (account.type === 'ton-multisig') {
                let multisig = client.getQueryData<Multisig>([
                    QueryKey.multisigWallet,
                    account.activeTonWallet.rawAddress
                ]);
                if (!multisig) {
                    multisig = await new MultisigApi(api.tonApiV2).getMultisigAccount({
                        accountId: account.activeTonWallet.rawAddress
                    });
                }
                const { signerWallet, signerAccount } = getMultisigSignerInfo(accounts, account);
                const signer = await getSigner(sdk, signerAccount.id, checkTouchId, {
                    walletId: signerWallet.id
                }).catch(() => null);
                if (signer?.type !== 'cell') {
                    throw new Error('Cant use this signer');
                }

                if (!options?.multisigTTL) {
                    throw new Error('TTL is required');
                }

                await sendMultisigNFTTransfer({
                    api,
                    hostWallet: signerWallet,
                    multisig,
                    recipient,
                    nftAddress: nftItem.address,
                    fee,
                    signer,
                    ttlSeconds: 60 * Number(options.multisigTTL)
                });
            } else {
                const signer = await getSigner(sdk, account.id, checkTouchId).catch(() => null);
                if (signer === null) return false;

                await sendNftTransfer(api, account, recipient, nftItem, fee, signer);
            }
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await invalidateAccountQueries();
        return true;
    });
};

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

    const estimation = useNftTransferEstimation(nftItem, recipient);
    const { mutateAsync, isLoading, error, reset } = useSendNft(
        recipient,
        nftItem,
        estimation.data?.payload,
        { multisigTTL }
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
        handleSubmit();
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
                    <ConfirmViewDetailsFee />
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
