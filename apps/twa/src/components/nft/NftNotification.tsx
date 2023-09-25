import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { NftPreview } from '@tonkeeper/uikit/dist/components/nft/NftView';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { FC, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useHandleBackButton } from '../../libs/twaHooks';

const PageWrapper = styled.div`
    padding: 0 10px 10px;
`;

const Content: FC<{ nftItem: NFT; handleClose: () => void }> = ({ nftItem, handleClose }) => {
    useHandleBackButton(handleClose);
    return (
        <PageWrapper>
            <NftPreview nftItem={nftItem} />
        </PageWrapper>
    );
};

export const TwaNftNotification: FC<PropsWithChildren> = ({ children }) => {
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

    if (nftItem) {
        return <Content nftItem={nftItem} handleClose={handleClose} />;
    } else {
        return <>{children}</>;
    }
};
