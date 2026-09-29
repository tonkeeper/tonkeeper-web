import { FC, ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface ChainBadgeOverlayProps {
    /**
     * Chain badge icon, typically one of the `IcChain*20` components in
     * `icons/components/`. Omit for native coin rows — no badge renders.
     */
    icon?: ReactNode;
    /** The token icon to wrap. */
    children: ReactNode;
    className?: string;
}

/**
 * Wraps a token icon and overlays a small chain badge at the bottom-right.
 * Disambiguates same-symbol tokens across chains (e.g. ETH-on-Ethereum vs ETH-on-Base).
 *
 * The 2px gap between badge and token is a transparent cutout masked out of
 * the token icon rather than a painted ring, so whatever sits behind the row
 * (hover tint, card surface, page) shows through unchanged.
 */
export const ChainBadgeOverlay: FC<ChainBadgeOverlayProps> = ({ icon, children, className }) => (
    <div className={cn('relative inline-block', className)}>
        {icon ? (
            <div className="flex [mask-image:radial-gradient(circle_at_calc(100%-8px)_calc(100%-8px),transparent_11.5px,black_12px)]">
                {children}
            </div>
        ) : (
            children
        )}
        {icon && (
            <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 overflow-hidden rounded-full [&>svg]:h-5 [&>svg]:w-5">
                {icon}
            </div>
        )}
    </div>
);
