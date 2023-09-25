import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    estimateNftTransfer,
    sendNftTransfer
} from '@tonkeeper/core/dist/service/transfer/nftService';
import { NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useState } from 'react';
import { useAppContext, useWalletContext } from '../../../hooks/appContext';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import { getWalletPassword } from '../../../state/password';
import { Gap } from '../../Layout';
import { ListBlock } from '../../List';
import { FullHeightBlock } from '../../Notification';
import { notifyError } from '../common';

import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonRecipientData, TransferEstimation } from '@tonkeeper/core/dist/entries/send';
import { MessageConsequences } from '@tonkeeper/core/dist/tonApiV2';
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

const assetAmount = new AssetAmount({
    asset: TON_ASSET,
    weiAmount: 0
});

const useNftTransferEstimation = (nftItem: NftItemRepr, data?: TonRecipientData) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useWalletContext();
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
    nftItem: NftItemRepr,
    fee?: MessageConsequences
) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();

    return useMutation<boolean, Error>(async () => {
        if (!fee) return false;
        const password = await getWalletPassword(sdk, 'confirm').catch(() => null);
        if (password === null) return false;

        track2('send-nft');
        try {
            await sendNftTransfer(sdk.storage, api, wallet, recipient, nftItem, fee, password);
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await client.invalidateQueries([wallet.active.rawAddress]);
        await client.invalidateQueries();
        return true;
    });
};

export const ConfirmNftView: FC<{
    recipient: TonRecipientData;
    nftItem: NftItemRepr;
    onClose: () => void;
    HeaderBlock: () => JSX.Element;
    MainButton: () => JSX.Element;
}> = ({ recipient, onClose, nftItem, HeaderBlock, MainButton }) => {
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
                <HeaderBlock />
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
                <MainButton />
            </FullHeightBlock>
        </ConfirmViewContext.Provider>
    );
};
