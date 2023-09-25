import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { FC, PropsWithChildren, useCallback, useEffect, useState } from 'react';

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
        return <div></div>;
    } else {
        return <>{children}</>;
    }
};
