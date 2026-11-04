import { FC, ReactNode } from 'react';

import {
    BrowserApp,
    browserAppBadgeChain
} from '@tonkeeper/core/dist/service/browserCatalogService';

import { useIsSkeleton, useSkeletonMask } from '../../../../primitives';
import IcChevronRight16 from '../../../../icons/components/IcChevronRight16';
import { networkIcon } from '../multichain-utils';

/**
 * Figma "Cell" of the category "See All" list: 44px app icon (with a chain
 * badge ringed in the cell surface), name over a two-line description, and a
 * trailing chevron. Rows stack inside a rounded content card with inset
 * dividers — the parent owns the card, this renders one row.
 */
export const BrowserAppListRow: FC<{
    app: Pick<BrowserApp, 'name' | 'description' | 'icon' | 'chains'>;
    onClick: () => void;
    /** Replaces the app icon; used by the "open typed address" search row. */
    leading?: ReactNode;
    /** Search results carry no chevron, only the category list does. */
    chevron?: boolean;
}> = ({ app, onClick, leading, chevron = true }) => {
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();
    const badgeChain = browserAppBadgeChain(app);
    const badge = badgeChain !== undefined && !isSkeleton ? networkIcon(badgeChain) : undefined;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isSkeleton}
            className="flex w-full cursor-pointer items-center bg-backgroundContent text-left transition-colors duration-100 hover:enabled:bg-backgroundContentTint disabled:cursor-default [--tk-skeleton-fill:var(--tk-background-content-tint)]"
        >
            <span className="py-4 pl-4">
                <span className="relative block size-11">
                    {isSkeleton ? (
                        <span {...mask({ w: 44, h: 44, r: 12 })} className="block size-11" />
                    ) : (
                        leading ?? (
                            <img
                                src={app.icon}
                                alt=""
                                loading="lazy"
                                className="size-11 rounded-xl bg-backgroundContentTint object-cover"
                            />
                        )
                    )}
                    {badge && (
                        <span className="absolute -bottom-0.5 -right-0.5 block h-5 w-5 overflow-hidden rounded-full ring-2 ring-backgroundContent [&>svg]:h-5 [&>svg]:w-5">
                            {badge}
                        </span>
                    )}
                </span>
            </span>
            <span className="flex min-w-0 flex-1 flex-col justify-center px-3 py-[11px]">
                <span {...mask({ w: 65 })} className="truncate text-label2 text-textPrimary">
                    {app.name}
                </span>
                {app.description !== '' && (
                    <span
                        {...mask({ w: 170 })}
                        className="line-clamp-2 text-body3Alt text-textSecondary"
                    >
                        {app.description}
                    </span>
                )}
            </span>
            <span className="py-4 pr-4">
                {chevron && !isSkeleton && (
                    <IcChevronRight16 className="size-4 text-textSecondary opacity-60" />
                )}
            </span>
        </button>
    );
};

/** Rounded content card stacking {@link BrowserAppListRow}s with inset dividers. */
export const BrowserAppListCard: FC<{ children: ReactNode[] | ReactNode }> = ({ children }) => (
    <div className="flex flex-col overflow-hidden rounded-2xl [&>*+*]:border-t [&>*+*]:border-separatorCommon">
        {children}
    </div>
);
