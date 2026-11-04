import { FC, ReactNode } from 'react';

import { cn } from '../../../libs/css';

/**
 * The home header's bare icon button: a 48×48 tap target holding a 28px icon
 * in `icon/secondary`, which sits 8px from the header's edges.
 *
 * Deliberately not the `Button` primitive. The header icons carry no button
 * surface, and the primitive's size recipe owns the padding and width this one
 * has to set — `cn` concatenates rather than merging Tailwind classes, so a
 * caller's `p-2.5` loses to `px-5` and the box comes out 68px wide.
 */
export const HomeHeaderIconButton: FC<{
    label: string;
    icon: ReactNode;
    onClick?: () => void;
    className?: string;
}> = ({ label, icon, onClick, className }) => (
    <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn(
            'flex size-12 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-2.5',
            'text-iconSecondary outline-0 transition-opacity hover:opacity-80',
            '[&>svg]:size-7',
            className
        )}
    >
        {icon}
    </button>
);
