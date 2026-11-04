import { FC, ReactNode } from 'react';

import { useIsSkeleton, useSkeletonMask } from '../../../primitives';
import IcChevronRight16 from '../../../icons/components/IcChevronRight16';

/**
 * The design library's "List Title" row: Label1 title with a trailing chevron
 * when the title navigates, and an optional control in the right slot (manage
 * button, network dropdown, static network label, …). One implementation for
 * every section that opens a fuller screen — portfolio Crypto and
 * Collectibles, the Trade shelves — so the row's height, chevron offsets and
 * hover treatment can't drift between screens.
 */
export const ListTitle: FC<{
    title: string;
    /** Present when the title navigates: adds the chevron and the hover. */
    onClick?: () => void;
    right?: ReactNode;
    /** Width of the bar the loading mockup draws over `right`. */
    skeletonRightWidth?: number;
}> = ({ title, onClick, right, skeletonRightWidth = 41 }) => {
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();

    const titleContent = (
        <>
            <span
                {...mask({ w: 107, h: 24, r: 12 })}
                className="min-w-0 truncate text-label1 text-textPrimary"
            >
                {title}
            </span>
            {onClick && !isSkeleton && (
                // Chevron offsets from the List Title spec: 2px side padding,
                // nudged 1px below center.
                <span className="shrink-0 px-0.5 pb-[3px] pt-[5px]">
                    <IcChevronRight16 className="size-4 opacity-40 transition-opacity duration-100 group-hover:opacity-100" />
                </span>
            )}
        </>
    );

    // The loading mockup replaces whatever control the row carries with one
    // standard bar on the right of the title.
    const rightContent = isSkeleton ? (
        <span {...mask({ w: skeletonRightWidth, h: 24, r: 12 })} className="block" />
    ) : (
        right
    );

    return (
        <div className="flex items-center gap-4">
            {onClick ? (
                <button
                    type="button"
                    onClick={onClick}
                    className="group flex min-w-0 flex-1 cursor-pointer items-center py-3 text-left"
                >
                    {titleContent}
                </button>
            ) : (
                <div className="flex min-w-0 flex-1 items-center py-3">{titleContent}</div>
            )}
            {rightContent && <div className="shrink-0 py-2">{rightContent}</div>}
        </div>
    );
};
