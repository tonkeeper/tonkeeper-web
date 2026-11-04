import { FC, MouseEvent } from 'react';

import {
    MULTICHAIN_CHAIN_DISPLAY_ORDER,
    orderMultichainChains
} from '@tonkeeper/core/dist/chains/multichain-chain-order';

import { cn } from '../../../libs/css';
import { useIsSkeleton } from '../../../primitives';
import { useTranslation } from '../../../hooks/translation';
import { networkIcon, networkLabel } from './multichain-utils';

function chipLabel(code: string): string {
    return code === 'ton' ? 'TON' : networkLabel(code);
}

/**
 * How far from the row's edge a clipped chip is scrolled to: clear of the
 * 62px edge fade the desktop column paints over the row, with the
 * neighbouring chip left peeking out as a scroll hint.
 */
const REVEAL_MARGIN = 72;

/**
 * Scrolls the row so a chip clipped at either edge sits `REVEAL_MARGIN`
 * inside it. Done by hand rather than `scrollIntoView`, which would also
 * scroll any `overflow-hidden` ancestor the row overhangs.
 */
function revealChip(event: MouseEvent<HTMLButtonElement>) {
    const chip = event.currentTarget;
    const row = chip.parentElement;
    if (!row) return;
    const rowRect = row.getBoundingClientRect();
    const chipRect = chip.getBoundingClientRect();
    const overflowLeft = rowRect.left + REVEAL_MARGIN - chipRect.left;
    const overflowRight = chipRect.right - (rowRect.right - REVEAL_MARGIN);
    if (overflowLeft > 0) {
        row.scrollBy({ left: -overflowLeft, behavior: 'smooth' });
    } else if (overflowRight > 0) {
        row.scrollBy({ left: overflowRight, behavior: 'smooth' });
    }
}

const chipBase =
    'flex h-8 shrink-0 items-center rounded-2xl text-label2 text-buttonSecondaryForeground transition-colors';

const chipBackground = (active: boolean) =>
    active
        ? 'bg-backgroundContentAttention'
        : 'bg-buttonSecondaryBackground hover:bg-buttonSecondaryBackgroundHighlighted';

export const MultichainChainChips: FC<{
    /** `undefined` = the "All" chip. */
    value?: string;
    onChange: (chain?: string) => void;
    /** Chains to offer; defaults to every backend-supported chain. */
    chains?: readonly string[];
}> = ({ value, onChange, chains = MULTICHAIN_CHAIN_DISPLAY_ORDER }) => {
    const { t } = useTranslation();
    // Availability is flow-specific; display order is not. Keeping the
    // normalization here prevents callers from silently drifting apart.
    const orderedChains = orderMultichainChains(chains);
    // While the surrounding list loads the chips render as labelless secondary
    // shapes, per the mockup — the filter has nothing to act on yet.
    const isSkeleton = useIsSkeleton();
    const chipSkeleton = 'bg-buttonSecondaryBackground text-transparent [&>*]:invisible';

    return (
        // `-mx-4 px-4` breaks the row out of the caller's horizontal padding
        // and re-applies a 16px inset inside the scrollable box itself, so
        // the row scrolls flush to the caller's edge instead of stopping
        // short at a fixed padding gutter — only the first/last chip keep
        // the inset, and only at rest. Callers padding by less than 16px
        // clip the overhang with `overflow-hidden`.
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
                type="button"
                onClick={event => {
                    revealChip(event);
                    onChange(undefined);
                }}
                disabled={isSkeleton}
                className={cn(
                    chipBase,
                    'px-3',
                    isSkeleton ? chipSkeleton : chipBackground(value === undefined)
                )}
            >
                {t('add_funds_chain_filter_all')}
            </button>
            {orderedChains.map(code => {
                // Chains outside the local registry (backend-only networks)
                // get a label-only chip rather than a blank icon circle.
                const icon = networkIcon(code);
                return (
                    <button
                        key={code}
                        type="button"
                        onClick={event => {
                            revealChip(event);
                            onChange(code);
                        }}
                        disabled={isSkeleton}
                        className={cn(
                            chipBase,
                            icon ? 'gap-1.5 pl-1.5 pr-3' : 'px-3',
                            isSkeleton ? chipSkeleton : chipBackground(value === code)
                        )}
                    >
                        {icon && (
                            <span className="flex size-5 items-center justify-center overflow-hidden rounded-full [&>svg]:size-5">
                                {icon}
                            </span>
                        )}
                        {chipLabel(code)}
                    </button>
                );
            })}
        </div>
    );
};
