import { FC, PropsWithChildren } from 'react';
import { cn } from '../../libs/css';

export type BadgeColor =
    | 'accentBlue'
    | 'accentBlueConstant'
    | 'accentGreen'
    | 'accentRed'
    | 'accentOrange'
    | 'accentPurple'
    | 'textSecondary';

export type BadgeBackground = 'backgroundContentAttention' | 'backgroundContentTint';

const textColor: Record<BadgeColor, string> = {
    accentBlue: 'text-accentBlue',
    accentBlueConstant: 'text-accentBlueConstant',
    accentGreen: 'text-accentGreen',
    accentRed: 'text-accentRed',
    accentOrange: 'text-accentOrange',
    accentPurple: 'text-accentPurple',
    textSecondary: 'text-textSecondary'
};

/**
 * With no explicit `background` the fill is the label color at 16%.
 * `color-mix` derives it from the live theme variable, so the tint keeps
 * following a theme switch instead of freezing at the value read on mount.
 */
const tintBackground: Record<BadgeColor, string> = {
    accentBlue: 'bg-[color-mix(in_srgb,var(--tk-accent-blue)_16%,transparent)]',
    accentBlueConstant: 'bg-[color-mix(in_srgb,var(--tk-accent-blue-constant)_16%,transparent)]',
    accentGreen: 'bg-[color-mix(in_srgb,var(--tk-accent-green)_16%,transparent)]',
    accentRed: 'bg-[color-mix(in_srgb,var(--tk-accent-red)_16%,transparent)]',
    accentOrange: 'bg-[color-mix(in_srgb,var(--tk-accent-orange)_16%,transparent)]',
    accentPurple: 'bg-[color-mix(in_srgb,var(--tk-accent-purple)_16%,transparent)]',
    textSecondary: 'bg-[color-mix(in_srgb,var(--tk-text-secondary)_16%,transparent)]'
};

const solidBackground: Record<BadgeBackground, string> = {
    backgroundContentAttention: 'bg-backgroundContentAttention',
    backgroundContentTint: 'bg-backgroundContentTint'
};

const sizeClasses = {
    m: 'px-[5px] py-[3px] rounded-corner3xSmall text-[10px] leading-[14px] font-semibold',
    s: 'px-1 py-0.5 rounded-[3px] text-[9px] leading-3 [font-weight:510]'
} as const;

export const Badge: FC<
    PropsWithChildren<{
        className?: string;
        color?: BadgeColor;
        display?: 'block' | 'inline-block';
        size?: 'm' | 's';
        background?: BadgeBackground;
    }>
> = ({ color = 'accentBlue', className, children, display = 'block', size = 'm', background }) => (
    <div
        className={cn(
            'h-fit shrink-0 uppercase not-italic',
            display === 'inline-block' ? 'inline-block' : 'block',
            sizeClasses[size],
            textColor[color],
            background ? solidBackground[background] : tintBackground[color],
            className
        )}
    >
        {children}
    </div>
);

export const RoundedBadge: FC<PropsWithChildren<{ className?: string }>> = ({
    className,
    children
}) => (
    <div
        className={cn(
            'flex aspect-square min-w-4 items-center justify-center rounded-cornerFull box-border px-1',
            'bg-accentRed text-textPrimary text-label3',
            className
        )}
    >
        {children}
    </div>
);
