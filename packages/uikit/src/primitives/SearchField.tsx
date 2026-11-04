import React, { forwardRef, useEffect, useRef } from 'react';
import { cn } from '../libs/css';
import { mergeRefs } from '../libs/common';
import { MagnifyingGlassIcon, XMarkCircleIcon } from '../components/Icon';

/**
 * The field's box and its icon slot, without the component's own outer
 * padding. Exported for a control that only has to *look* like the field —
 * the Trade tab's entry button — so the geometry is stated once.
 */
export const searchFieldBoxClass =
    'flex h-12 items-center rounded-medium bg-backgroundContent transition-colors duration-100 hover:bg-backgroundContentTint focus-within:bg-backgroundContentTint';

export const searchFieldIconClass =
    'flex h-full shrink-0 items-center pl-4 pr-3 text-iconSecondary';

export interface SearchFieldProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    /** Delay (ms) before applying autoFocus when the field appears inside an
     * animated sheet. Ignored unless `autoFocus` is true. */
    autoFocusDelay?: number;

    /** When provided, renders the header layout with a trailing Cancel button. */
    onCancel?: () => void;
    cancelLabel?: string;

    id?: string;
    className?: string;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
    (
        {
            value,
            onChange,
            placeholder = 'Search',
            disabled,
            autoFocus,
            autoFocusDelay,
            onCancel,
            cancelLabel = 'Cancel',
            id,
            className,
            onFocus,
            onBlur
        },
        ref
    ) => {
        const isHeader = !!onCancel;
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
            if (!autoFocus || autoFocusDelay == null) return;
            const timer = window.setTimeout(() => inputRef.current?.focus(), autoFocusDelay);
            return () => window.clearTimeout(timer);
        }, [autoFocus, autoFocusDelay]);

        const box = (
            // A label, so the whole box is the hit area and a click anywhere
            // in it puts the caret in the field.
            <label
                className={cn(
                    searchFieldBoxClass,
                    'cursor-text',
                    isHeader ? 'min-w-0 flex-1' : 'w-full'
                )}
            >
                <span aria-hidden className={searchFieldIconClass}>
                    <MagnifyingGlassIcon />
                </span>
                <input
                    ref={mergeRefs(ref, inputRef)}
                    id={id}
                    type="search"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    disabled={disabled}
                    autoFocus={autoFocus && autoFocusDelay == null}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder={placeholder}
                    className={cn(
                        'min-w-0 grow border-0 bg-transparent text-body1 text-textPrimary outline-none placeholder:text-textSecondary',
                        // `type=search` earns the role, and with it Chromium's
                        // own clear button — which would sit beside ours.
                        '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden',
                        !value && 'pr-4'
                    )}
                />
                {!!value && (
                    <button
                        type="button"
                        aria-label="Clear"
                        onClick={() => onChange('')}
                        className="flex h-full shrink-0 items-center border-0 bg-transparent p-4 text-iconSecondary"
                    >
                        <XMarkCircleIcon />
                    </button>
                )}
            </label>
        );

        if (!isHeader) {
            return <div className={cn('w-full px-4 pb-2', className)}>{box}</div>;
        }

        return (
            <div className={cn('flex w-full items-center py-2 pl-4', className)}>
                {box}
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex shrink-0 items-center border-0 bg-transparent py-3 pl-4 pr-5 text-label1 text-textAccent"
                >
                    {cancelLabel}
                </button>
            </div>
        );
    }
);
SearchField.displayName = 'SearchField';
