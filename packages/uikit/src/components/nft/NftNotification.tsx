import { NFT } from '@tonkeeper/core/dist/entries/nft';
import React, { useCallback, useEffect, useState } from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { Notification } from '../Notification';
import { NftPreview } from './NftView';

const NftNotification = () => {
    const sdk = useAppSdk();
    const [nftItem, setNft] = useState<NFT | undefined>(undefined);

    const handleClose = useCallback(() => {
        setNft(undefined);
    }, [setNft]);

    useEffect(() => {
        const handler = (options: { method: 'nft'; id?: number | undefined; params: NFT }) => {
            setNft(options.params);
        };

        sdk.uiEvents.on('nft', handler);
        return () => {
            sdk.uiEvents.off('nft', handler);
        };
    }, [sdk, setNft]);

    const Content = useCallback(() => {
        if (!nftItem) return undefined;
        return <NftPreview onClose={handleClose} nftItem={nftItem} />;
    }, [nftItem, handleClose]);

    return (
        <Notification
            isOpen={nftItem !== undefined}
            hideButton
            handleClose={handleClose}
            backShadow
        >
            {Content}
        </Notification>
    );
};

export default NftNotification;
