import { FC, useState } from 'react';

import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import type { CrossSwapAsset } from '@tonkeeper/core/dist/swapsApi';

import { AssetPicker } from './MultichainSwapFlow';

/**
 * CT mount wrapper standing in for the catalog's server search: each query
 * and chain the picker reports is answered from `catalog` by symbol or name.
 */
export const AssetPickerSearchHarness: FC<{
    assets: CrossSwapAsset[];
    catalog: CrossSwapAsset[];
    walletAssets: MultichainWalletAsset[];
    requirePositiveBalance?: boolean;
    onSearchChange?: (query: string, chainId: string | undefined) => void;
}> = ({ assets, catalog, walletAssets, requirePositiveBalance, onSearchChange }) => {
    const [searchResults, setSearchResults] = useState<CrossSwapAsset[]>();

    const search = (query: string, chainId: string | undefined) => {
        onSearchChange?.(query, chainId);
        const normalized = query.trim().toLowerCase();
        setSearchResults(
            catalog.filter(
                asset =>
                    (!chainId || asset.chainId === chainId) &&
                    (asset.symbol.toLowerCase().includes(normalized) ||
                        asset.name.toLowerCase().includes(normalized))
            )
        );
    };

    return (
        <div className="flex h-[560px] w-[358px] flex-col">
            <AssetPicker
                assets={assets}
                walletAssets={walletAssets}
                counterpart={undefined}
                selected={undefined}
                requirePositiveBalance={requirePositiveBalance}
                onSelect={() => {}}
                onSearchChange={search}
                searchResults={searchResults}
            />
        </div>
    );
};
