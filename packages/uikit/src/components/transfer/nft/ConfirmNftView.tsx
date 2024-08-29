import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    estimateNftTransfer,
    sendNftTransfer
} from '@tonkeeper/core/dist/service/transfer/nftService';
import { NftItem } from '@tonkeeper/core/dist/tonApiV2';
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
    useActiveAccount,
    useActiveStandardTonWallet,
    useInvalidateActiveWalletQueries
} from '../../../state/wallet';
import { isAccountControllable } from '@tonkeeper/core/dist/entries/account';

const assetAmount = new AssetAmount({
    asset: TON_ASSET,
    weiAmount: 0
});

const useNftTransferEstimation = (nftItem: NftItem, data?: TonRecipientData) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useActiveStandardTonWallet();
    const client = useQueryClient();

    return useQuery<TransferEstimation<TonAsset>, Error>(
        [QueryKey.estimate, data?.address],
        async () => {
            try {
                const payload = await estimateNftTransfer(api, wallet, data!, nftItem);
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
    fee?: TransferEstimationEvent
) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const account = useActiveAccount();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<boolean, Error>(async () => {
        if (!isAccountControllable(account)) {
            console.error("Can't send a transfer using this account");
            return false;
        }

        if (!fee) return false;

        const signer = await getSigner(sdk, account.id, checkTouchId).catch(() => null);
        if (signer === null) return false;

        track2('send-nft');
        try {
            await sendNftTransfer(api, account, recipient, nftItem, fee, signer);
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
}> = ({ recipient, onClose, nftItem, headerBlock, mainButton }) => {
    const { standalone } = useAppContext();
    const [done, setDone] = useState(false);
    const { t } = useTranslation();

    const estimation = useNftTransferEstimation(nftItem, recipient);
    const { mutateAsync, isLoading, error, reset } = useSendNft(
        recipient,
        nftItem,
        estimation.data?.payload
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
                {mainButton}
            </FullHeightBlock>
        </ConfirmViewContext.Provider>
    );
};
