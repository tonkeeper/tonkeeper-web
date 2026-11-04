import { FC } from 'react';

import { cn } from '../libs/css';
import { useTranslation } from '../hooks/translation';
import IcChevronLeft16 from '../icons/components/IcChevronLeft16';

/**
 * The "Header / Back" figure from the design library: a 32px secondary
 * circle with a chevron, used by every screen that has a way back —
 * asset, history, collectibles, settings, staking, the catalog sheet.
 *
 * Positioning belongs to the header that hosts it (headers place it at
 * their own inset), so this owns the figure only and takes `className`
 * for the placement.
 */
export const BackButton: FC<{ onClick: () => void; className?: string }> = ({
    onClick,
    className
}) => {
    const { t } = useTranslation();

    return (
        <button
            type="button"
            aria-label={t('wallet_asset_back')}
            onClick={onClick}
            className={cn(
                'flex size-8 cursor-pointer items-center justify-center rounded-medium bg-buttonSecondaryBackground text-buttonSecondaryForeground transition-colors duration-100 hover:bg-buttonSecondaryBackgroundHighlighted',
                className
            )}
        >
            <IcChevronLeft16 className="size-4" />
        </button>
    );
};
