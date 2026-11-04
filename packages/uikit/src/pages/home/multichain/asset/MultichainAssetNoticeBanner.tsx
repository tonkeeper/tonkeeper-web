import { FC } from 'react';

import { cn } from '../../../../libs/css';
import IcChevronRight12 from '../../../../icons/components/IcChevronRight12';
import IcChevronRight16 from '../../../../icons/components/IcChevronRight16';

export type AssetNoticeVariant = 'warning' | 'info';

/**
 * Notice under the chart with two roles, per the mockup annotation: an
 * orange warning for unverified regular tokens, and a blue explainer for
 * tokenized stocks / ETFs. Tapping opens the matching sheet.
 *
 * Mobile renders it as a full-width strip (Figma 4177:158036); the desktop
 * column (`compact`) renders it as a centered pill (Figma 1625:30275).
 */
export const MultichainAssetNoticeBanner: FC<{
    variant: AssetNoticeVariant;
    text: string;
    onClick: () => void;
    compact?: boolean;
}> = ({ variant, text, onClick, compact = false }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            'flex cursor-pointer items-center justify-center py-1.5 text-body2 transition-colors duration-100',
            compact ? 'self-center rounded-full pl-3 pr-2' : 'w-full',
            variant === 'warning'
                ? 'bg-[color-mix(in_srgb,var(--tk-accent-orange)_8%,transparent)] text-accentOrange hover:bg-[color-mix(in_srgb,var(--tk-accent-orange)_16%,transparent)]'
                : 'bg-[color-mix(in_srgb,var(--tk-accent-blue)_8%,transparent)] text-accentBlue hover:bg-[color-mix(in_srgb,var(--tk-accent-blue)_16%,transparent)]'
        )}
    >
        <span>{text}</span>
        <span className="py-1 pl-1">
            {compact ? (
                <IcChevronRight12 className="size-3" />
            ) : (
                <IcChevronRight16 className="size-3" />
            )}
        </span>
    </button>
);
