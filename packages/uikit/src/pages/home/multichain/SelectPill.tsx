import { ReactNode, useEffect, useRef, useState } from 'react';

import { cn } from '../../../libs/css';
import IcDone16 from '../../../icons/components/IcDone16';
import IcSwitch16 from '../../../icons/components/IcSwitch16';

export interface SelectOption<V> {
    value: V;
    label: string;
}

export interface SelectDropdownProps<V> {
    value: V;
    options: SelectOption<V>[];
    onChange: (value: V) => void;
    /** The two placements the mockups use, nothing in between. */
    menuPosition?: 'above-center' | 'below-end';
    menuWidth?: number;
    /**
     * The control that opens the menu. It receives the selected option and
     * the open state; the trigger must call `toggle` from its own `onClick`.
     */
    trigger: (state: {
        selected: SelectOption<V> | undefined;
        open: boolean;
        toggle: () => void;
    }) => ReactNode;
}

/**
 * Checkmarked list of mutually exclusive options anchored to an arbitrary
 * trigger (Figma action-sheet option list). {@link SelectPill} is the pill
 * flavour; the swap confirm's slippage stepper anchors it to a plain value.
 */
export function SelectDropdown<V>({
    value,
    options,
    onChange,
    menuPosition = 'below-end',
    menuWidth = 220,
    trigger
}: SelectDropdownProps<V>) {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const selected = options.find(option => option.value === value);

    return (
        <div ref={wrapperRef} className="relative">
            {open && (
                <div
                    style={{ width: menuWidth }}
                    className={cn(
                        'absolute z-50 overflow-hidden rounded-medium bg-backgroundContentTint text-left shadow-[0_4px_16px_rgba(0,0,0,0.04),0_16px_64px_rgba(0,0,0,0.08)]',
                        menuPosition === 'above-center'
                            ? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
                            : 'right-0 top-full mt-1'
                    )}
                >
                    {options.map((option, idx) => (
                        <button
                            key={String(option.value)}
                            type="button"
                            aria-pressed={option.value === value}
                            onClick={() => {
                                setOpen(false);
                                onChange(option.value);
                            }}
                            className={cn(
                                'flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors duration-100 hover:bg-backgroundHighlighted',
                                idx > 0 && 'border-t border-separatorCommon'
                            )}
                        >
                            <span className="min-w-0 flex-1 truncate text-label1 text-textPrimary">
                                {option.label}
                            </span>
                            {option.value === value && (
                                <IcDone16 className="size-4 shrink-0 text-textAccent" />
                            )}
                        </button>
                    ))}
                </div>
            )}
            {trigger({ selected, open, toggle: () => setOpen(o => !o) })}
        </div>
    );
}

export interface SelectPillProps<V> extends Omit<SelectDropdownProps<V>, 'trigger'> {
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
        <SelectDropdown
            {...dropdown}
            trigger={({ selected, open, toggle }) => (
                <button
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={open}
                    onClick={toggle}
                    className={cn(
                        'flex cursor-pointer items-center gap-1.5 rounded-medium text-label2 transition-colors duration-100',
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
