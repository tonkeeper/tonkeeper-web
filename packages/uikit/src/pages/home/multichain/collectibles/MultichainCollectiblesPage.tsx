import { FC, useState } from 'react';

import { NFT } from '@tonkeeper/core/dist/entries/nft';

import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useNavigateBack } from '../../../../hooks/router/useNavigateBack';
import { MultichainRoute } from '../../../../libs/routes';
import { useWalletVisibleNftList } from '../../../../state/nft';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../../../state/tonendpoint';
import { Navigate } from '../../../../components/shared/Navigate';
import { MultichainCollectiblesView } from './MultichainCollectiblesView';
import { MultichainNftDetailsSheet } from './MultichainNftDetailsSheet';

export const MultichainCollectiblesPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const navigate = useNavigate();
    const navigateBack = useNavigateBack(MultichainRoute.home);
    const { data: nfts, isError, refetch } = useWalletVisibleNftList();
    const [selectedNft, setSelectedNft] = useState<NFT | undefined>();

    const isNftEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.NFT);
    if (!isNftEnabled) {
        return <Navigate to={MultichainRoute.home} />;
    }

    return (
        <>
            <MultichainCollectiblesView
                compact={compact}
                nfts={nfts}
                isError={!nfts && isError}
                onRetry={() => refetch()}
                onBack={navigateBack}
                onOpenNft={setSelectedNft}
                onOpenSettings={() => navigate(MultichainRoute.collectiblesSettings)}
            />
            <MultichainNftDetailsSheet
                nft={selectedNft}
                isOpen={selectedNft !== undefined}
                onClose={() => setSelectedNft(undefined)}
            />
        </>
    );
};
