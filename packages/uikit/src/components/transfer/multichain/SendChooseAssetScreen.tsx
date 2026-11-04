import { FC, useEffect, useMemo, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { isSupportedChainKitNetwork } from '@tonkeeper/core/dist/service/chainkit/chainKitClient';
import { networksOfChains } from '@tonkeeper/core/dist/chains/multichain-chain-order';

import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';
import { Button, ChainChip, Loader, SkeletonScope, useIsSkeleton } from '../../../primitives';
import { Modal } from '../../../primitives/Modal';
import { SearchField } from '../../../primitives/SearchField';
import { useTranslation } from '../../../hooks/translation';
import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useMultichainSendAssets } from '../../../state/multichain/useMultichainSendAssets';
import { useActiveAccount } from '../../../state/wallet';
import {
    isNativeRow,
    networkLabel,
    parseAssetIdHead
} from '../../../pages/home/multichain/multichain-utils';
import { MultichainChainChips } from '../../../pages/home/multichain/MultichainChainChips';
import {
    TokenCell,
    TokenCellIcon,
    TokenTrustedBadge
} from '../../../pages/home/multichain/TokenCell';
import { PLACEHOLDER_ASSETS } from '../../../pages/home/multichain/multichain-placeholders';
import { InlineRetryRow } from '../../shared/InlineRetryRow';
import { ModalCenterError } from '../../shared/ModalCenterState';
import IcExclamationmarkCircle28 from '../../../icons/components/IcExclamationmarkCircle28';
import IcDonemarkOutline28 from '../../../icons/components/IcDonemarkOutline28';
import IcFolder84 from '../../../icons/components/IcFolder84';
import { AssetIcon } from './multichainSendShared';

export interface SendChooseAssetScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    onSelect: (asset: MultichainWalletAsset) => void;
    /** Currently-picked asset — shows a check when re-opened from the form's token pill. */
    selectedAssetId?: string;
    /** Opens the add-funds flow from the empty state. */
    onAddFunds?: () => void;
    /**
     * Only offer assets on these network keys — the chains a link's
     * recipient address is valid on. Undefined shows everything.
     */
    allowedNetworks?: string[];
}

const AssetRow: FC<{
    asset: MultichainWalletAsset;
    fiat: FiatCurrencies;
    selected: boolean;
    onClick: () => void;
}> = ({ asset, fiat, selected, onClick }) => {
    const isSkeleton = useIsSkeleton();
    const { network } = parseAssetIdHead(asset.assetId);
    const native = isNativeRow(asset.assetId);
    const human = new BigNumber(asset.balance).shiftedBy(-asset.decimals);
    const fiatBalance = asset.price ? human.multipliedBy(asset.price) : undefined;

    return (
        <TokenCell
            onClick={onClick}
            selected={selected}
            className="transition-colors hover:bg-backgroundContentTint"
            icon={
                isSkeleton ? (
                    <TokenCellIcon assetId={asset.assetId} />
                ) : (
                    <AssetIcon asset={asset} size={44} />
                )
            }
            title={asset.symbol}
            titleExtras={
                <>
                    <TokenTrustedBadge verification={asset.verification} />
                    {!native && <ChainChip label={networkLabel(network)} />}
                </>
            }
            subtitle={`${formatAmount(human)} ${asset.symbol}${
                fiatBalance ? ` · ${formatFiatCurrency(fiat, fiatBalance)}` : ''
            }`}
            accessory={
                selected && (
                    <span className="shrink-0 text-textAccent">
                        <IcDonemarkOutline28 className="h-6 w-6" />
                    </span>
                )
            }
        />
    );
};

export const SendChooseAssetScreen: FC<SendChooseAssetScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    onSelect,
    selectedAssetId,
    onAddFunds,
    allowedNetworks
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const account = useActiveAccount();
    const [search, setSearch] = useState('');
    const [network, setNetwork] = useState<string>('all');
    const {
        assets: walletAssets,
        isPreviousData,
        isError,
        refetch,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage
    } = useMultichainSendAssets({
        chain: network === 'all' ? undefined : network,
        search
    });

    // Chips follow the wallet's addresses, not its holdings, so a network the
    // user can receive on is filterable before anything has arrived there.
    const chainFilters = useMemo(() => {
        const chains = account.type === 'multichain' ? account.enabledChains : [];
        return networksOfChains(chains).filter(
            head =>
                isSupportedChainKitNetwork(head) &&
                (allowedNetworks === undefined || allowedNetworks.includes(head))
        );
    }, [account, allowedNetworks]);

    // Only show assets this chain-kit build can actually transact on — the
    // backend lists holdings on networks (polygon/avalanche/sol) that have no
    // send path yet, and a tappable row there dead-ends on a disabled confirm.
    const assets = useMemo(
        () =>
            walletAssets?.filter(asset => {
                const head = parseAssetIdHead(asset.assetId).network;
                if (!isSupportedChainKitNetwork(head)) return false;
                return allowedNetworks === undefined || allowedNetworks.includes(head);
            }),
        [walletAssets, allowedNetworks]
    );

    // Retries are off on the query, so an error with nothing loaded is final
    // and gets a retry in place of the list; a failed later page keeps the
    // rows already shown and offers the retry in the list footer.
    const showError = !assets && isError;
    const isLoading = !assets && !isError;
    const viewAssets = assets ?? PLACEHOLDER_ASSETS;
    const retryLoadMore = () => (hasNextPage ? fetchNextPage() : refetch());

    // Empty wallet (nothing sendable at all) gets the onboarding empty state;
    // an empty search or chain result keeps the search + chips and just says
    // "no results". While a new query loads, the rows on screen still answer
    // the previous one, so they say nothing about the wallet. Rows on networks
    // without a send path are dropped here, so an empty page can still have
    // more pages behind it.
    const nothingFound = viewAssets.length === 0 && !hasNextPage;
    const walletEmpty = nothingFound && !search.trim() && network === 'all' && !isPreviousData;

    const scrollRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        scrollRef.current?.scrollTo(0, 0);
    }, [network, search]);

    // A failed page must not re-arm the observer: the sentinel is still in
    // view, so it would refire the same request in a loop.
    const sentinelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasNextPage || isError) return;
        const observer = new IntersectionObserver(entries => {
            if (entries.some(e => e.isIntersecting) && !isFetchingNextPage) {
                fetchNextPage();
            }
        });
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isError]);

    return (
        // `variant="content"` + `mobileHeight="full"` keep the sheet a constant size while the
        // user filters — otherwise the modal grows/shrinks with the result count,
        // which is jarring (the search field jumps under the cursor). The search +
        // chips stick to the top; only the result list scrolls.
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            topBarTitle={t('send_choose_asset_title')}
            variant="content"
            mobileHeight="full"
        >
            <div className="flex h-full flex-col">
                <div className="flex shrink-0 flex-col gap-3 pb-3">
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder={t('send_choose_asset_search')}
                        className="!p-0"
                    />

                    <MultichainChainChips
                        value={network === 'all' ? undefined : network}
                        onChange={next => setNetwork(next ?? 'all')}
                        chains={chainFilters}
                    />
                </div>

                {walletEmpty ? (
                    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 pb-8 text-center">
                        <span className="text-textAccent">
                            <IcFolder84 className="h-14 w-14" />
                        </span>
                        <p className="text-label1 text-textPrimary">{t('send_empty_title')}</p>
                        <p className="text-body2 text-textSecondary">{t('send_empty_subtitle')}</p>
                        {onAddFunds && (
                            <Button variant="secondary" className="mt-4" onClick={onAddFunds}>
                                {t('wallet_add_funds')}
                            </Button>
                        )}
                    </div>
                ) : showError ? (
                    <div className="flex flex-1 flex-col justify-center pb-8">
                        <ModalCenterError
                            icon={<IcExclamationmarkCircle28 />}
                            onRetry={() => refetch()}
                        />
                    </div>
                ) : (
                    <SkeletonScope loading={isLoading}>
                        <div
                            ref={scrollRef}
                            className="min-h-0 flex-1 overflow-y-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            <div className="overflow-hidden rounded-medium bg-backgroundContent">
                                {nothingFound ? (
                                    <p className="py-8 text-center text-body2 text-textSecondary">
                                        {t('send_choose_asset_empty')}
                                    </p>
                                ) : (
                                    <>
                                        {viewAssets.map((asset, idx) => (
                                            <div
                                                key={asset.assetId}
                                                className={
                                                    idx === 0
                                                        ? ''
                                                        : 'border-t border-separatorCommon'
                                                }
                                            >
                                                <AssetRow
                                                    asset={asset}
                                                    fiat={fiat}
                                                    selected={asset.assetId === selectedAssetId}
                                                    onClick={() => onSelect(asset)}
                                                />
                                            </div>
                                        ))}
                                        <div ref={sentinelRef} aria-hidden />
                                        {isFetchingNextPage && (
                                            <div className="flex justify-center py-4">
                                                <Loader size="small" />
                                            </div>
                                        )}
                                        {isError && !isFetchingNextPage && (
                                            <InlineRetryRow onRetry={retryLoadMore} />
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </SkeletonScope>
                )}
            </div>
        </Modal>
    );
};
