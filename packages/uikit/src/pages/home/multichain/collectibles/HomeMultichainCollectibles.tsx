import { FC, useState } from 'react';

import { NFT } from '@tonkeeper/core/dist/entries/nft';

import { IconButton } from '../../../../primitives';
import { cn } from '../../../../libs/css';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute } from '../../../../libs/routes';
import { useWalletNftList, useWalletVisibleNftList } from '../../../../state/nft';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../../../state/tonendpoint';
import IcChevronLeft28 from '../../../../icons/components/IcChevronLeft28';
import { ListTitle } from '../ListTitle';
import { resolveHomeCollectiblesState } from './home-collectibles-utils';
import { HomeMultichainAllCollectiblesHidden } from './HomeMultichainAllCollectiblesHidden';
import { MultichainNftDetailsSheet } from './MultichainNftDetailsSheet';
import { NftCardSmall } from './NftCardSmall';

/**
 * Mobile shows up to 10 cards in a horizontal scroller with a See All
 * card at the end when there are more. Desktop has no scroller: exactly
 * the 4 cards that fit the 520px column, nothing else — the section
 * title is the only way to the full gallery.
 */
const SECTION_NFT_LIMIT = { full: 10, compact: 4 } as const;

/**
 * Collectibles section on the multichain home, below Crypto. TON NFTs only
 * (the multichain backend has no NFT support for other chains yet). Hidden
 * entirely when the wallet owns none; when everything is filtered out, the
 * section stays visible with a shortcut to collectibles settings.
 */
export const HomeMultichainCollectibles: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isNftEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.NFT);
    const { data: nfts } = useWalletVisibleNftList();
    const { data: allNfts } = useWalletNftList();
    const [selectedNft, setSelectedNft] = useState<NFT | undefined>();
    const state = resolveHomeCollectiblesState(nfts, allNfts);

    if (!isNftEnabled || state === 'loading' || state === 'empty') {
        return null;
    }

    const openCollectibles = () => navigate(MultichainRoute.collectibles);

    const limit = compact ? SECTION_NFT_LIMIT.compact : SECTION_NFT_LIMIT.full;
    const visible = nfts?.slice(0, limit) ?? [];
    const showSeeAll = !compact && (nfts?.length ?? 0) > limit;

    return (
        <section className={cn('flex flex-col', !compact && 'pb-4')}>
            <ListTitle title={t('wallet_collectibles')} onClick={openCollectibles} />
            {state === 'all-hidden' && (
                <HomeMultichainAllCollectiblesHidden
                    onClick={() => navigate(MultichainRoute.collectiblesSettings)}
                />
            )}
            {/*
             * On mobile the scroller bleeds through the page's 16px side
             * padding (-mx-4/px-4) so cards clip at the viewport edge.
             * Mandatory x-snap keeps every rest position aligned to a card
             * start — and to the See All card's end — so the See All card
             * is never left partially visible.
             */}
            {state === 'items' && (
                <div
                    className={cn(
                        'flex items-stretch gap-2',
                        !compact &&
                            '-mx-4 -my-1 snap-x snap-mandatory overflow-x-auto px-4 py-1 scroll-px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
                    )}
                >
                    {visible.map(nft => (
                        <NftCardSmall
                            key={nft.address}
                            nft={nft}
                            onClick={() => setSelectedNft(nft)}
                            className={cn(
                                'shrink-0 snap-start',
                                compact ? 'w-[116px]' : 'w-[114px]'
                            )}
                        />
                    ))}
                    {showSeeAll && (
                        <div className="flex w-[114px] shrink-0 snap-end flex-col items-center justify-center">
                            <IconButton
                                icon={<IcChevronLeft28 className="rotate-180" />}
                                label={t('multichain_collectibles_see_all')}
                                onClick={openCollectibles}
                            />
                        </div>
                    )}
                </div>
            )}
            <MultichainNftDetailsSheet
                nft={selectedNft}
                isOpen={selectedNft !== undefined}
                onClose={() => setSelectedNft(undefined)}
            />
        </section>
    );
};
