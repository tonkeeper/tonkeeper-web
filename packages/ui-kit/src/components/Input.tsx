import React, {
    ButtonHTMLAttributes,
    InputHTMLAttributes,
    ReactNode,
    forwardRef,
    useEffect,
    useRef,
    useState
} from 'react';
import { mergeRefs } from '../utils/mergeRefs';
import { cn } from '../utils/cn';
import IcXmarkCircle16 from '../icons/components/IcXmarkCircle16';

/**
 * Internal building blocks for `Input` and `TextArea`. Not exported from the
 * primitives barrel: callers should use `Input` / `TextArea` directly.
 */

interface InputBlockProps {
    focus: boolean;
    valid: boolean;
    scanner?: boolean;
    /** A trailing slot is rendered; it brings its own right padding. */
    trailing?: boolean;
    size?: 'small' | 'medium';
    noLabel?: boolean;
    className?: string;
    children?: ReactNode;
}

export type { InputBlockProps };

export const InputBlock = forwardRef<HTMLDivElement, InputBlockProps>(
    ({ focus, valid, scanner, trailing, size, noLabel, className, children }, ref) => {
        const isError = !valid;
        const borderClass = isError
            ? 'border-fieldErrorBorder'
            : focus
            ? 'border-fieldActiveBorder'
            : 'border-transparent';
        // The error tint is translucent and sits on top of the field fill, not
        // on whatever is behind the field.
        const bgClass = isError
            ? 'bg-fieldBackground [background-image:linear-gradient(var(--tk-field-error-background),var(--tk-field-error-background))]'
            : 'bg-fieldBackground';

        const heightClass = size === 'small' ? 'min-h-9' : noLabel ? 'min-h-14' : 'min-h-16';
        const paddingClass =
            size === 'small' ? (trailing ? 'pl-3' : 'px-3') : trailing ? 'pl-4' : 'px-4';

        return (
            <div
                ref={ref}
                className={cn(
                    'relative box-border flex w-full items-center gap-2 rounded-medium border-[1.5px] transition-colors',
                    heightClass,
                    paddingClass,
                    borderClass,
                    bgClass,
                    scanner && 'pr-14',
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
    noLabel?: boolean;
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    ({ marginRight, size, noLabel, className, style, ...rest }, ref) => (
        <input
            ref={ref}
            {...rest}
            style={marginRight ? { ...style, marginRight } : style}
            className={cn(
                'min-w-0 grow border-0 bg-transparent text-body1 text-textPrimary caret-accentBlue outline-none placeholder:text-textSecondary',
                // Chrome paints autofilled values with its own background and text
                // colour on the bare <input>, which stops short of the trailing
                // slot; the inset shadow overrides it with the field's own tint.
                'autofill:shadow-[inset_0_0_0_1000px_var(--tk-field-background)] autofill:[-webkit-text-fill-color:var(--tk-text-primary)]',
                size === 'small' ? 'py-2' : noLabel ? 'py-[14.5px]' : 'pb-[10.5px] pt-[26.5px]',
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
    ({ active, htmlFor, className, children }, ref) => (
        // Offsets are from inside the 1.5px border. Resting: centered in the
        // 64px field. Lifted: body1 scaled to body3 (12px), top at 12px.
        <label
            ref={ref}
            htmlFor={htmlFor}
            className={cn(
                'pointer-events-none absolute left-4 top-0 origin-top-left select-none whitespace-nowrap text-body1 leading-none text-textSecondary transition-transform duration-200 ease-out',
                active ? 'translate-y-[10.5px] scale-[0.75]' : 'translate-y-[22.5px]',
                className
            )}
        >
            {children}
        </label>
    )
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

export const InputClearButton = ({
    onClear,
    disabled
}: {
    onClear: () => void;
    disabled?: boolean;
}) => (
    <button
        type="button"
        aria-label="Clear"
        disabled={disabled}
        // Keeps focus (and the floated label) in the field while clearing.
        onMouseDown={e => e.preventDefault()}
        onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            onClear();
        }}
        className="flex shrink-0 cursor-pointer items-center self-stretch border-0 bg-transparent px-5 text-iconSecondary transition-[color,opacity] [-webkit-tap-highlight-color:transparent] hover:enabled:text-iconPrimary active:enabled:opacity-80 disabled:cursor-auto"
    >
        <IcXmarkCircle16 className="size-4" />
    </button>
);

type InputTrailingButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>;

/**
 * Trailing parts for `Input`'s `rightElement` slot. Each carries its own
 * padding, so they sit flush against the field's right border.
 */
export const InputTextButton = ({ className, ...rest }: InputTrailingButtonProps) => (
    <button
        type="button"
        {...rest}
        className={cn(
            'flex shrink-0 cursor-pointer items-center self-stretch whitespace-nowrap border-0 bg-transparent px-5 text-label1 text-accentBlue transition-opacity [-webkit-tap-highlight-color:transparent] hover:enabled:opacity-80 active:enabled:opacity-80 disabled:cursor-auto',
            // Followed by an icon button (the "Text + Icon" pair) the text
            // button narrows to the icon button's padding.
            '[&:has(+*)]:px-3.5',
            className
        )}
    />
);

export const InputIconButton = ({ className, ...rest }: InputTrailingButtonProps) => (
    <button
        type="button"
        {...rest}
        className={cn(
            'flex shrink-0 cursor-pointer items-center self-stretch border-0 bg-transparent p-3.5 text-accentBlue transition-opacity [-webkit-tap-highlight-color:transparent] hover:enabled:opacity-80 active:enabled:opacity-80 disabled:cursor-auto [&>svg]:size-7',
            className
        )}
    />
);

export const InputPillButton = ({ className, ...rest }: InputTrailingButtonProps) => (
    <button
        type="button"
        {...rest}
        className={cn(
            'mr-4 flex shrink-0 cursor-pointer items-center whitespace-nowrap rounded-medium border-0 bg-buttonTertiaryBackground px-3 py-1.5 text-label2 text-buttonTertiaryForeground pressable hover:enabled:bg-buttonTertiaryBackgroundHighlighted disabled:cursor-auto',
            className
        )}
    />
);

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
    label?: string;
    helpText?: string;
    clearButton?: boolean;
    /** Trailing slot, laid out beside the text. Takes `InputTextButton`,
     * `InputIconButton` (or both, in that order) or `InputPillButton`. */
    rightElement?: ReactNode;
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
            label,
            disabled,
            helpText,
            tabIndex,
            clearButton,
            rightElement,
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
        const showsClear = !!value && !!clearButton && !rightElement;

        return (
            <OuterBlock className={className}>
                <InputBlock
                    focus={focus}
                    valid={isValid}
                    trailing={!!rightElement || showsClear}
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
                        noLabel={!showsFloatingLabel && size !== 'small'}
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
                        <div className="flex shrink-0 items-center self-stretch">
                            {rightElement}
                        </div>
                    )}
                    {showsClear && (
                        <InputClearButton disabled={disabled} onClear={() => onChange?.('')} />
                    )}
                </InputBlock>
                {helpText && <HelpText valid={isValid}>{helpText}</HelpText>}
            </OuterBlock>
        );
    }
);
Input.displayName = 'Input';
