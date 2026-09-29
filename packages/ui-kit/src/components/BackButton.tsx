import { FC } from 'react';

import { cn } from '../utils/cn';
import IcChevronLeft16 from '../icons/components/IcChevronLeft16';

export interface BackButtonProps {
    onClick: () => void;
    /** Accessible name; pass the translated string in localised apps. */
    label?: string;
    className?: string;
}

/**
 * The "Header / Back" figure from the design library: a 32px secondary
 * circle with a chevron, used by every screen that has a way back.
 *
 * Positioning belongs to the header that hosts it (headers place it at
 * their own inset), so this owns the figure only and takes `className`
 * for the placement.
 */
export const BackButton: FC<BackButtonProps> = ({ onClick, label = 'Back', className }) => (
    <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(
            'flex size-8 cursor-pointer items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground pressable hover:bg-buttonSecondaryBackgroundHighlighted',
            className
        )}
    >
        <IcChevronLeft16 className="size-4" />
    </button>
);
