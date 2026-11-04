import React, { forwardRef, useState } from 'react';
import { cn } from '../libs/css';

/**
 * Single-line input with a right-aligned numeric prefix used by the seed-phrase
 * entry flow.
 */
export interface FieldWordProps {
    value: string;
    onChange: (value: string) => void;
    number: number | string;

    error?: boolean;

    id?: string;
    tabIndex?: number;
    autoComplete?: string;
    autoCorrect?: string;
    spellCheck?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    onPaste?: React.ClipboardEventHandler<HTMLInputElement>;

    className?: string;
}

export const FieldWord = forwardRef<HTMLInputElement, FieldWordProps>(
    ({ value, onChange, number, error, className, onFocus, onBlur, ...rest }, ref) => {
        const [focused, setFocused] = useState(false);

        const borderClass = error
            ? 'border-fieldErrorBorder'
            : focused
            ? 'border-fieldActiveBorder'
            : 'border-transparent';
        const bgClass = error ? 'bg-fieldErrorBackground' : 'bg-fieldBackground';

        return (
            <label
                className={cn(
                    'relative flex h-14 w-full items-center gap-3 rounded-medium border-[1.5px] px-3 transition-colors',
                    borderClass,
                    bgClass,
                    className
                )}
            >
                <span
                    aria-hidden
                    className="w-7 select-none text-right text-body1 text-textSecondary"
                >
                    {number}:
                </span>
                <input
                    ref={ref}
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onFocus={e => {
                        setFocused(true);
                        onFocus?.(e);
                    }}
                    onBlur={e => {
                        setFocused(false);
                        onBlur?.(e);
                    }}
                    className="min-w-0 grow border-0 bg-transparent text-body1 text-textPrimary outline-none placeholder:text-textSecondary"
                    {...rest}
                />
            </label>
        );
    }
);
FieldWord.displayName = 'FieldWord';
