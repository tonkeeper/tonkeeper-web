import { ReactNode, useEffect, useRef, useState } from 'react';

import { cn } from '../utils/cn';
import IcDone16 from '../icons/components/IcDone16';

export interface DropdownOption<V> {
    value: V;
    label: string;
}

export interface DropdownProps<V> {
    value: V;
    options: DropdownOption<V>[];
    onChange: (value: V) => void;
    /** The two placements the mockups use, nothing in between. */
    menuPosition?: 'above-center' | 'below-end';
    menuWidth?: number;
    /**
     * The control that opens the menu. It receives the selected option and
     * the open state; the trigger must call `toggle` from its own `onClick`.
     */
    trigger: (state: {
        selected: DropdownOption<V> | undefined;
        open: boolean;
        toggle: () => void;
    }) => ReactNode;
}

/**
 * Checkmarked list of mutually exclusive options anchored to an arbitrary
 * trigger (Figma action-sheet option list). {@link SelectPill} is the pill
 * flavour; any other control can be the trigger.
 */
export function Dropdown<V>({
    value,
    options,
    onChange,
    menuPosition = 'below-end',
    menuWidth = 220,
    trigger
}: DropdownProps<V>) {
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

    // `w-fit` keeps the anchor the trigger's size: a stretching parent (a
    // `flex-col` column, a block) would otherwise widen it, and the menu would
    // align to the parent's edge instead of the trigger's.
    return (
        <div ref={wrapperRef} className="relative w-fit">
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
                                'flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors duration-100 [-webkit-tap-highlight-color:transparent] hover:bg-backgroundHighlighted active:bg-backgroundHighlighted',
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
