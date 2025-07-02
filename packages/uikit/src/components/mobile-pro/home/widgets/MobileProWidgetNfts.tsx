import React, { FC, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../../../../hooks/translation';
import { NftItemView } from '../../../nft/Nfts';
import { NFT } from '@tonkeeper/core/dist/entries/nft';
import { useAppSdk } from '../../../../hooks/appSdk';
import { Skeleton } from '../../../shared/Skeleton';
import { useWalletFilteredNftList } from '../../../../state/nft';
import { useActiveTonWalletConfig, useMutateActiveTonWalletConfig } from '../../../../state/wallet';
import { KnownNFTDnsCollections } from '../../../nft/NftView';
import { useFetchFilteredActivity } from '../../../../state/activity';

const Wrapper = styled.div`
    padding: 0.5rem 0 1rem;

    border-bottom: 1px solid ${p => p.theme.separatorCommon};
`;

const NftGrid = styled.div`
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 0 1rem;
`;

const SkeletonsGrid = styled.div`
    display: grid;
    gap: 0.5rem;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 0 1rem;

    > * {
        aspect-ratio: 1 / 1;
        height: unset;
        width: unset;
    }
`;

export const useMobileProHomePageHistory = () => {
    const { data: activity } = useFetchFilteredActivity();
    const { data: config } = useActiveTonWalletConfig();
    const { mutate: mutateConfig } = useMutateActiveTonWalletConfig();

    useEffect(() => {
        if (activity && config && !config.cachedHasHistory) {
            mutateConfig({ cachedHasHistory: !!activity.length });
        }
    }, [activity, config?.cachedHasHistory, mutateConfig]);

    let showHistoryWidget = config?.cachedHasHistory !== false;

    if (activity) {
        showHistoryWidget = !!activity.length;
    }

    const slicedActivity = useMemo(() => activity?.slice(0, 1), [activity]);

    return {
        activity: slicedActivity,
        showHistoryWidget
    };
};

export const useMobileProHomePageNfts = () => {
    const { data: nfts } = useWalletFilteredNftList();
    const { data: config } = useActiveTonWalletConfig();
    const { mutate: mutateConfig } = useMutateActiveTonWalletConfig();

    const filteredNft = useMemo(
        () =>
            nfts?.filter(
                nft =>
                    !nft.collection?.address ||
                    !KnownNFTDnsCollections.includes(nft.collection.address)
            ),
        [nfts]
    );

    useEffect(() => {
        if (filteredNft && config && filteredNft.length !== config.cachedOwnCollectablesNumber) {
            mutateConfig({ cachedOwnCollectablesNumber: filteredNft.length });
        }
    }, [filteredNft, config?.cachedOwnCollectablesNumber, mutateConfig]);

    let showNftWidget = !!config;
    if (config) {
        if (
            config.cachedOwnCollectablesNumber === undefined ||
            config.cachedOwnCollectablesNumber >= 3
        ) {
            showNftWidget = true;
        } else {
            showNftWidget = false;
        }
    }

    if (filteredNft) {
        showNftWidget = filteredNft.length >= 3;
    }

    return {
        filteredNft,
        showNftWidget
    };
};

export const MobileProWidgetNfts: FC<{ className?: string; nfts?: NFT[] }> = ({
    className,
    nfts
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    return (
        <Wrapper className={className}>
            <div>{t('wallet_aside_collectibles')}</div>
            {nfts ? (
                <NftGrid>
                    {nfts.slice(0, 3).map(item => (
                        <NftItemView
                            key={item.address}
                            nft={item}
                            resolution="500x500"
                            hideText
                            onOpen={() => sdk.openNft(item)}
                        />
                    ))}
                </NftGrid>
            ) : (
                <SkeletonsGrid>
                    {[0, 1, 2].map((_, i) => (
                        <Skeleton key={i} />
                    ))}
                </SkeletonsGrid>
            )}
        </Wrapper>
    );
};
