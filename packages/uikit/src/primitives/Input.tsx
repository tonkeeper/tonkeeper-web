import React, {
    InputHTMLAttributes,
    ReactNode,
    forwardRef,
    useEffect,
    useRef,
    useState
} from 'react';
import { useTheme } from 'styled-components';
import { mergeRefs } from '../libs/common';
import { cn } from '../libs/css';
import { XmarkIcon } from '../components/Icon';

/**
 * Internal building blocks for `Input` and `TextArea`. Not exported from the
 * primitives barrel: callers should use `Input` / `TextArea` directly.
 */

interface InputBlockProps {
    focus: boolean;
    valid: boolean;
    isSuccess?: boolean;
    scanner?: boolean;
    clearButton?: boolean;
    size?: 'small' | 'medium';
    noLabel?: boolean;
    className?: string;
    children?: ReactNode;
}

export type { InputBlockProps };

export const InputBlock = forwardRef<HTMLDivElement, InputBlockProps>(
    (
        { focus, valid, isSuccess, scanner, clearButton, size, noLabel, className, children },
        ref
    ) => {
        const isError = !valid;
        const borderClass = isSuccess
            ? 'border-accentGreen'
            : isError
            ? 'border-fieldErrorBorder'
            : focus
            ? 'border-fieldActiveBorder'
            : 'border-transparent';
        const bgClass = isError ? 'bg-fieldErrorBackground' : 'bg-fieldBackground';

        const heightClass =
            size === 'small'
                ? 'min-h-9 px-3'
                : isError || noLabel
                ? 'min-h-14 px-4'
                : 'min-h-16 px-4';

        return (
            <div
                ref={ref}
                className={cn(
                    'relative box-border flex w-full items-center gap-2 rounded-medium border-[1.5px] transition-colors',
                    heightClass,
                    borderClass,
                    bgClass,
                    scanner && 'pr-14',
                    clearButton && 'pr-8',
                    className
                )}
            >
                {children}
            </div>
        );
    }
);
InputBlock.displayName = 'InputBlock';

export interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
    marginRight?: string;
    size?: 'small' | 'medium';
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    ({ marginRight, size, className, style, ...rest }, ref) => (
        <input
            ref={ref}
            {...rest}
            style={marginRight ? { ...style, marginRight } : style}
            className={cn(
                'min-w-0 grow border-0 bg-transparent text-body1 font-medium text-textPrimary outline-none placeholder:text-textSecondary',
                // Chrome paints autofilled values with its own background and text
                // colour on the bare <input>, which stops short of the trailing
                // slot; the inset shadow overrides it with the field's own tint.
                'autofill:shadow-[inset_0_0_0_1000px_var(--tk-field-background)] autofill:[-webkit-text-fill-color:var(--tk-text-primary)]',
                size === 'small' ? 'py-2' : 'pb-[10px] pt-[30px]',
                className
            )}
        />
    )
);
InputField.displayName = 'InputField';

interface LabelProps {
    active?: boolean;
    htmlFor?: string;
    className?: string;
    children?: ReactNode;
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
    ({ active, htmlFor, className, children }, ref) => {
        const theme = useTheme();
        const isFullWidth = theme?.displayType === 'full-width';

        // Resting: vertically centered in the 64px (min-h-16) field —
        // (64 − 16px line) / 2 = 24px. Lifted: floated to the top on
        // focus / when filled.
        const resting = 'translate-y-[24px]';
        const lifted = isFullWidth
            ? 'translate-y-[10px] scale-[0.7]'
            : 'translate-y-[12px] scale-[0.7]';

        return (
            <label
                ref={ref}
                htmlFor={htmlFor}
                className={cn(
                    'pointer-events-none absolute left-4 top-0 origin-top-left select-none whitespace-nowrap text-body1 leading-none text-textSecondary transition-transform duration-200 ease-out',
                    active ? lifted : resting,
                    className
                )}
            >
                {children}
            </label>
        );
    }
);
Label.displayName = 'Label';

export const OuterBlock = forwardRef<HTMLDivElement, { className?: string; children?: ReactNode }>(
    ({ className, children }, ref) => (
        <div ref={ref} className={cn('w-full', className)}>
            {children}
        </div>
    )
);
OuterBlock.displayName = 'OuterBlock';

interface HelpTextProps {
    valid: boolean;
    className?: string;
    children?: ReactNode;
}

export const HelpText = forwardRef<HTMLParagraphElement, HelpTextProps>(
    ({ valid, className, children }, ref) => (
        <p
            ref={ref}
            className={cn(
                'mt-3 inline-block w-full select-none text-left text-body3',
                valid ? 'text-textSecondary' : 'text-fieldErrorBorder',
                className
            )}
        >
            {children}
        </p>
    )
);
HelpText.displayName = 'HelpText';

export type InputProps = Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'autoFocus' | 'onChange' | 'size'
> & {
    id: string;
    value: string;
    onChange?: (value: string) => void;
    onFocusChange?: (isFocused: boolean) => void;
    onSubmit?: () => void;
    isValid?: boolean;
    isSuccess?: boolean;
    label?: string;
    helpText?: string;
    clearButton?: boolean;
    rightElement?: ReactNode;
    /** Reserves trailing space inside the input (e.g. when a `rightElement` overlaps). */
    marginRight?: string;
    size?: 'small' | 'medium';
    autoFocus?: number | boolean | 'notification';
    autoSelect?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            id,
            value,
            onChange,
            onFocusChange,
            isValid = true,
            isSuccess = false,
            label,
            disabled,
            helpText,
            tabIndex,
            clearButton,
            rightElement,
            marginRight,
            className,
            size,
            autoFocus,
            autoSelect,
            ...rest
        },
        ref
    ) => {
        const [focus, _setFocus] = useState(false);
        const focused = useRef(false);
        const setFocus = (v: boolean) => {
            _setFocus(v);
            onFocusChange?.(v);
        };

        const onClear: React.MouseEventHandler<HTMLButtonElement> = e => {
            e.stopPropagation();
            e.preventDefault();
            if (disabled) return;
            onChange?.('');
        };

        const el = useRef<HTMLInputElement>(null);

        useEffect(() => {
            if (el.current && !focused.current && autoFocus) {
                setTimeout(
                    () => {
                        el.current?.focus();
                        if (autoSelect) {
                            setTimeout(() => {
                                el.current?.select();
                            }, 0);
                        }
                    },
                    typeof autoFocus === 'number'
                        ? autoFocus
                        : autoFocus === 'notification'
                        ? 400
                        : 30
                );
                focused.current = true;
            }
        }, [autoFocus, autoSelect]);

        const showsFloatingLabel = !!label && size !== 'small';

        return (
            <OuterBlock className={className}>
                <InputBlock
                    focus={focus}
                    valid={isValid}
                    isSuccess={isSuccess}
                    clearButton={clearButton}
                    size={size}
                    noLabel={!showsFloatingLabel && size !== 'small'}
                >
                    <InputField
                        {...rest}
                        id={id}
                        ref={mergeRefs(ref, el)}
                        disabled={disabled}
                        value={value}
                        spellCheck={false}
                        autoCorrect="off"
                        autoComplete="off"
                        tabIndex={tabIndex}
                        size={size}
                        marginRight={marginRight}
                        onChange={e => onChange && onChange(e.target.value)}
                        onFocus={() => setFocus(true)}
                        onBlur={() => setFocus(false)}
                        placeholder={size === 'small' || !showsFloatingLabel ? label : undefined}
                        autoFocus={!!autoFocus}
                    />
                    {showsFloatingLabel && (
                        <Label active={value !== '' || focus} htmlFor={id}>
                            {label}
                        </Label>
                    )}
                    {rightElement && (
                        <div className="absolute right-4 flex h-full items-center">
                            {rightElement}
                        </div>
                    )}
                    {!!value && clearButton && !rightElement && (
                        <button
                            type="button"
                            aria-label="Clear"
                            onClick={onClear}
                            className="absolute right-4 flex h-full cursor-pointer items-center border-0 bg-transparent p-0 text-textSecondary transition-colors hover:text-textTertiary"
                        >
                            <XmarkIcon />
                        </button>
                    )}
                </InputBlock>
                {helpText && <HelpText valid={isValid}>{helpText}</HelpText>}
            </OuterBlock>
        );
    }
);
Input.displayName = 'Input';
