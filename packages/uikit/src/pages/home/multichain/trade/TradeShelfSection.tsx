import { FC, useMemo, useState } from 'react';

import { TradingMarketAsset, TradingShelfGroup } from '@tonkeeper/core/dist/service/tradingService';

import { SegmentedControl } from '../../../../primitives';
import { ListTitle } from '../ListTitle';
import { TradeNetworkDropdown } from './TradeNetworkDropdown';
import { TradeTokenGridCell } from './TradeTokenGridCell';

const GRID_COLUMNS = 4;

function chunkRows(items: TradingMarketAsset[]): TradingMarketAsset[][] {
    const rows: TradingMarketAsset[][] = [];
    for (let i = 0; i < items.length; i += GRID_COLUMNS) {
        rows.push(items.slice(i, i + GRID_COLUMNS));
    }
    return rows;
}

/**
 * One server-configured shelf group (Figma "List Title" + "Section" pairs on
 * Trade/Default, e.g. 3341:120968 + 3341:120985). The group renders:
 *   - the group title, navigating to the catalog when the active shelf
 *     enables "see all";
 *   - a network dropdown when the group carries more than one chain variant
 *     (a single-chain group has nothing to pick, so it shows no chain control);
 *   - a segmented toggle when the chain carries more than one shelf
 *     (Market Cap / Volume, Top Gainers / Top Losers, Stocks / ETFs);
 *   - the active shelf's items in rows of four.
 */

/**
 * Chain and shelf picks survive leaving the Trade tab (history, asset page,
 * catalog) for the rest of the session. Keyed by server group id; a stored
 * value that a fresh config no longer offers falls back to the server
 * default via the `?? chains[0]` / `?? shelves[0]` lookups below.
 */
const sessionSelectionByGroup = new Map<string, { chain?: string; shelfKey?: string }>();
export interface TradeShelfSeeAllArgs {
    group: TradingShelfGroup;
    chain: string;
    shelfKey: string;
    /** Catalog tab the shelf's "see all" targets (`seeAll.route`). */
    route: string;
}

export const TradeShelfSection: FC<{
    group: TradingShelfGroup;
    onSeeAll?: (args: TradeShelfSeeAllArgs) => void;
}> = ({ group, onSeeAll }) => {
    const [chainName, setChainName] = useState(
        () => sessionSelectionByGroup.get(group.id)?.chain ?? group.chains[0]?.chain
    );
    const activeChain = group.chains.find(c => c.chain === chainName) ?? group.chains[0];

    const [shelfKey, setShelfKey] = useState<string | undefined>(
        () => sessionSelectionByGroup.get(group.id)?.shelfKey ?? activeChain?.shelves[0]?.key
    );
    const shelves = activeChain?.shelves ?? [];
    const activeShelf = shelves.find(s => s.key === shelfKey) ?? shelves[0];

    const selectChain = (chain: string) => {
        sessionSelectionByGroup.set(group.id, {
            ...sessionSelectionByGroup.get(group.id),
            chain
        });
        setChainName(chain);
    };
    const selectShelf = (key: string) => {
        sessionSelectionByGroup.set(group.id, {
            ...sessionSelectionByGroup.get(group.id),
            shelfKey: key
        });
        setShelfKey(key);
    };

    const rows = useMemo(() => chunkRows(activeShelf?.items ?? []), [activeShelf]);

    if (!activeChain || !activeShelf || rows.length === 0) return null;

    // The server sends the chains it wants offered, most popular first —
    // that's why the default is the first entry.
    const right =
        group.chains.length > 1 ? (
            <TradeNetworkDropdown
                value={activeChain.chain}
                options={group.chains.map(c => c.chain)}
                onChange={selectChain}
            />
        ) : undefined;

    return (
        <section>
            <ListTitle
                title={group.name}
                onClick={
                    activeShelf.seeAll.enabled && onSeeAll
                        ? () =>
                              onSeeAll({
                                  group,
                                  chain: activeChain.chain,
                                  shelfKey: activeShelf.key,
                                  route: activeShelf.seeAll.route
                              })
                        : undefined
                }
                right={right}
            />
            <div className="overflow-hidden rounded-2xl bg-backgroundContent py-2 [--tk-skeleton-fill:var(--tk-background-content-tint)]">
                {shelves.length > 1 && (
                    <div className="px-2 pb-2">
                        <SegmentedControl
                            options={shelves.map(s => ({ value: s.key, label: s.title }))}
                            value={activeShelf.key}
                            onChange={selectShelf}
                        />
                    </div>
                )}
                {rows.map((row, idx) => (
                    <div key={idx} className="flex items-start justify-between px-3">
                        {row.map(asset => (
                            <TradeTokenGridCell key={asset.assetId} asset={asset} />
                        ))}
                        {row.length < GRID_COLUMNS &&
                            Array.from({ length: GRID_COLUMNS - row.length }).map((_, i) => (
                                <div key={`pad-${i}`} className="min-w-0 flex-1 px-0.5" />
                            ))}
                    </div>
                ))}
            </div>
        </section>
    );
};
