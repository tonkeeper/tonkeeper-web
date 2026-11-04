import React, { forwardRef } from 'react';
import { cn } from '../libs/css';
import { useIsSkeleton, useSkeletonMask } from './Skeleton';

export interface IconButtonProps {
    icon: React.ReactNode;
    label: React.ReactNode;
    disabled?: boolean;
    /** Force the highlighted look (used on iOS, which has no CSS `:hover`). */
    hovered?: boolean;
    onClick?: () => void;
    className?: string;
}

export const IconButton = forwardRef<HTMLDivElement, IconButtonProps>(
    ({ icon, label, disabled, hovered, onClick, className }, ref) => {
        // Loading state per the mockup: the chip stays as a shape on the
        // `content` fill with its icon hidden, the label paints as a bar.
        const isSkeleton = useIsSkeleton();
        const mask = useSkeletonMask();

        return (
            <div
                ref={ref}
                onClick={disabled || isSkeleton ? undefined : onClick}
                className={cn(
                    'group flex w-fit min-w-[76px] select-none flex-col items-center gap-2 px-1 py-2 text-center',
                    disabled || isSkeleton ? 'cursor-auto' : 'cursor-pointer',
                    className
                )}
            >
                <div
                    className={cn(
                        'flex h-[44px] w-[44px] items-center justify-center rounded-full transition-colors duration-100',
                        // SVGR icons in this repo have no intrinsic size, so the inner
                        // svg is constrained here. 28px matches the home-action icons.
                        '[&>svg]:h-7 [&>svg]:w-7',
                        isSkeleton
                            ? 'bg-backgroundContent [&>*]:invisible'
                            : disabled
                            ? 'bg-buttonSecondaryBackgroundDisabled text-buttonSecondaryForegroundDisabled'
                            : hovered
                            ? 'bg-buttonTertiaryBackgroundHighlighted text-textPrimary'
                            : 'bg-buttonTertiaryBackground text-textPrimary group-hover:bg-buttonTertiaryBackgroundHighlighted'
                    )}
                >
                    {icon}
                </div>
                <span
                    {...mask({ w: 60, h: 16 })}
                    className={cn(
                        'whitespace-nowrap text-label3 transition-colors duration-100',
                        disabled
                            ? 'text-buttonSecondaryForegroundDisabled'
                            : hovered
                            ? 'text-textPrimary'
                            : 'text-textSecondary group-hover:text-textPrimary'
                    )}
                >
                    {label}
                </span>
            </div>
        );
    }
);
IconButton.displayName = 'IconButton';
