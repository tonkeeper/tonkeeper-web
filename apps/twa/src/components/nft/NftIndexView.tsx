import { useBackButton } from '@tma.js/sdk-react';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { NftPreview } from '@tonkeeper/uikit/dist/components/nft/NftView';
import { FC, useEffect } from 'react';

export const NftIndexView: FC<{ nftItem: NFT; handleClose: () => void }> = ({
    nftItem,
    handleClose
}) => {
    const backButton = useBackButton();

    useEffect(() => {
        backButton.show();
        backButton.on('click', handleClose);
        return () => {
            backButton.off('click', handleClose);
        };
    }, [handleClose, backButton]);

    return <NftPreview nftItem={nftItem} />;
};
