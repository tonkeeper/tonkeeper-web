import { ReactNode } from 'react';

import { cn } from '../utils/cn';
import IcSwitch16 from '../icons/components/IcSwitch16';
import { Dropdown, DropdownProps } from './Dropdown';

export interface SelectPillProps<V> extends Omit<DropdownProps<V>, 'trigger'> {
    /** Leading glyph on the pill (the globe on chain filters). */
    icon?: ReactNode;
    /**
     * `secondary` — 32px pill on the secondary button surface, for a control
     * that sits in a title row. `tertiary` — 36px pill on the raised surface,
     * for one that floats over the content it filters.
     */
    variant?: 'secondary' | 'tertiary';
    /** Extras for the pill itself (the floating variants' drop shadow). */
    className?: string;
}

/**
 * Pill that opens a checkmarked list of mutually exclusive options — the shelf
 * chain filter, the history type filter and the catalog sort control are all
 * this one control (Figma "Small Text Button" + the action-sheet option list).
 * The pill always shows the selected option's label.
 */
export function SelectPill<V>({
    icon,
    variant = 'secondary',
    className,
    ...dropdown
}: SelectPillProps<V>) {
    return (
        <Dropdown
            {...dropdown}
            trigger={({ selected, open, toggle }) => (
                <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={toggle}
                    className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-medium text-label2 pressable',
                        variant === 'secondary'
                            ? 'bg-buttonSecondaryBackground px-3 py-1.5 text-buttonSecondaryForeground hover:bg-buttonSecondaryBackgroundHighlighted'
                            : 'h-9 bg-buttonTertiaryBackground px-4 text-buttonTertiaryForeground hover:bg-buttonTertiaryBackgroundHighlighted',
                        className
                    )}
                >
                    {icon}
                    <span>{selected?.label}</span>
                    <IcSwitch16 className="size-4" />
                </button>
            )}
        />
    );
}
