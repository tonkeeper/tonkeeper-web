import { FC } from 'react';

import { cn } from '../utils/cn';
import IcClose16 from '../icons/components/IcClose16';

export interface CloseButtonProps {
    onClick: () => void;
    /** Accessible name; pass the translated string in localised apps. */
    label?: string;
    className?: string;
}

/**
 * The "Header / Close" twin of {@link BackButton}: the same 32px secondary
 * circle, carrying the cross. Every modal header dismisses through this one
 * figure, so its size, tint and hover can't drift between sheets.
 *
 * Positioning belongs to the header that hosts it, so this owns the figure
 * only and takes `className` for the placement.
 */
export const CloseButton: FC<CloseButtonProps> = ({ onClick, label = 'Close', className }) => (
    <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(
            'flex size-8 cursor-pointer items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground pressable hover:bg-buttonSecondaryBackgroundHighlighted',
            className
        )}
    >
        <IcClose16 className="size-4" />
    </button>
);
