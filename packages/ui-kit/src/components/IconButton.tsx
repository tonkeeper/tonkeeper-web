import React, { forwardRef } from 'react';
import { cn } from '../utils/cn';
import { useIsSkeleton, useSkeletonMask } from './Skeleton';

export interface IconButtonProps {
    icon: React.ReactNode;
    label: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const IconButton = forwardRef<HTMLDivElement, IconButtonProps>(
    ({ icon, label, onClick, className }, ref) => {
        // Loading state per the mockup: the chip stays as a shape on the
        // `content` fill with its icon hidden, the label paints as a bar.
        const isSkeleton = useIsSkeleton();
        const mask = useSkeletonMask();

        return (
            <div
                ref={ref}
                onClick={isSkeleton ? undefined : onClick}
                className={cn(
                    'group flex w-[72px] select-none [-webkit-tap-highlight-color:transparent] flex-col items-center gap-2 px-1 py-2 text-center',
                    isSkeleton ? 'cursor-auto' : 'cursor-pointer',
                    className
                )}
            >
                <div
                    className={cn(
                        'flex h-[44px] w-[44px] items-center justify-center rounded-full transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.33,1,0.68,1)]',
                        // SVGR icons in this repo have no intrinsic size, so the inner
                        // svg is constrained here. 28px matches the home-action icons.
                        '[&>svg]:h-7 [&>svg]:w-7',
                        isSkeleton
                            ? 'bg-backgroundContent [&>*]:invisible'
                            : 'bg-buttonTertiaryBackground text-textPrimary group-hover:bg-buttonTertiaryBackgroundHighlighted group-active:scale-[0.98] group-active:duration-100 motion-reduce:group-active:scale-100'
                    )}
                >
                    {icon}
                </div>
                <span
                    {...mask({ w: 60, h: 16 })}
                    className="w-full break-words text-label3 text-textSecondary transition-colors duration-100 group-hover:text-textPrimary"
                >
                    {label}
                </span>
            </div>
        );
    }
);
IconButton.displayName = 'IconButton';
