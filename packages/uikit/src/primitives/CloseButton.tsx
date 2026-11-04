import { FC } from 'react';

import { cn } from '../libs/css';
import { useTranslation } from '../hooks/translation';
import IcClose16 from '../icons/components/IcClose16';

/**
 * The "Header / Close" twin of {@link BackButton}: the same 32px secondary
 * circle, carrying the cross. Every modal header dismisses through this one
 * figure, so its size, tint and hover can't drift between sheets.
 *
 * Positioning belongs to the header that hosts it, so this owns the figure
 * only and takes `className` for the placement.
 */
export const CloseButton: FC<{ onClick: () => void; className?: string }> = ({
    onClick,
    className
}) => {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            aria-label={t('close')}
            onClick={onClick}
            className={cn(
                'flex size-8 cursor-pointer items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground transition-colors duration-100 hover:bg-buttonSecondaryBackgroundHighlighted',
                className
            )}
        >
            <IcClose16 className="size-4" />
        </button>
    );
};
