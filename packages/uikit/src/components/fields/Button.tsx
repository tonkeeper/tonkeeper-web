import React, { ComponentProps, FC, PropsWithChildren, ReactNode, forwardRef } from 'react';
import styled, { useTheme } from 'styled-components';
import { cn } from '../../libs/css';
import { Loader } from '../Loader';

/**
 * @deprecated Use `Button` from `../../primitives/Button`.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'warn';

export interface ButtonProps {
    loading?: boolean;

    size?: 'small' | 'medium' | 'large';

    /** Preferred way to set the visual variant. */
    variant?: ButtonVariant;

    /** Legacy boolean variants. If `variant` is set it wins. */
    primary?: boolean;
    secondary?: boolean;
    warn?: boolean;

    disabled?: boolean;
    fullWidth?: boolean;
    fitContent?: boolean;
    bottom?: boolean;
    marginTop?: boolean;
    corner?: '3xSmall' | '2xSmall' | 'small' | 'medium' | 'large' | 'full';

    /** Icon rendered before the label. Recommended size: 16 (small) / 24 (large). */
    leftIcon?: ReactNode;
    /** Icon rendered after the label. Recommended size: 16 (small) / 24 (large). */
    rightIcon?: ReactNode;

    type?: 'button' | 'submit' | 'reset' | undefined;
}

// Static literal classes so Tailwind's scanner emits them.
const SIZE_BOX = {
    small: 'h-9 px-4', //   36 / 16
    medium: 'h-12 px-5', // 48 / 20
    large: 'h-14 px-6' //   56 / 24
} as const satisfies Record<NonNullable<ButtonProps['size']>, string>;

// Icon-only buttons are square — height equals width at the chosen size, with
// no horizontal padding so the icon sits centred.
const SIZE_BOX_ICON_ONLY = {
    small: 'h-9 w-9 px-0', //    36 × 36
    medium: 'h-12 w-12 px-0', // 48 × 48
    large: 'h-14 w-14 px-0' //   56 × 56
} as const satisfies Record<NonNullable<ButtonProps['size']>, string>;

// `corner` is named after the styled-components theme token (`cornerSmall` =
// 16px, `cornerLarge` = 24px, …) — distinct from Tailwind's `rounded-*` scale,
// which uses `medium` for 16px. The mapping preserves the legacy prop values.
const CORNER_CLASS = {
    '3xSmall': 'rounded-extraExtraSmall', //  4px
    '2xSmall': 'rounded-extraSmall', //      8px
    small: 'rounded-medium', //              16px
    medium: 'rounded-large', //              20px
    large: 'rounded-[24px]', //              24px (no Tailwind token at this tier)
    full: 'rounded-full'
} as const satisfies Record<NonNullable<ButtonProps['corner']>, string>;

const VARIANT_CLASS = {
    primary:
        'bg-buttonPrimaryBackground text-buttonPrimaryForeground [&:not(:disabled)]:hover:bg-buttonPrimaryBackgroundHighlighted disabled:bg-buttonPrimaryBackgroundDisabled disabled:text-buttonPrimaryForegroundDisabled',
    secondary:
        'bg-buttonSecondaryBackground text-buttonSecondaryForeground [&:not(:disabled)]:hover:bg-buttonSecondaryBackgroundHighlighted disabled:bg-buttonSecondaryBackgroundDisabled disabled:text-buttonSecondaryForegroundDisabled',
    warn: 'bg-buttonWarnBackground text-buttonWarnForeground [&:not(:disabled)]:hover:bg-buttonWarnBackgroundHighlighted disabled:bg-buttonWarnBackgroundDisabled disabled:text-buttonWarnForegroundDisabled',
    tertiary:
        'bg-buttonTertiaryBackground text-buttonTertiaryForeground [&:not(:disabled)]:hover:bg-buttonTertiaryBackgroundHighlighted disabled:bg-buttonTertiaryBackgroundDisabled disabled:text-buttonTertiaryForegroundDisabled'
} as const satisfies Record<ButtonVariant, string>;

/**
 * Resolve the active variant: the explicit `variant` prop wins, then the
 * legacy boolean flags, then the `tertiary` default.
 */
const resolveVariant = (
    props: Pick<ButtonProps, 'variant' | 'primary' | 'secondary' | 'warn'>
): ButtonVariant =>
    props.variant ??
    (props.primary ? 'primary' : props.secondary ? 'secondary' : props.warn ? 'warn' : 'tertiary');

type ButtonClassNameInput = Omit<ButtonProps, 'loading' | 'leftIcon' | 'rightIcon' | 'type'> & {
    /** Render as a square (icon-only). Set automatically by `Button`. */
    iconOnly?: boolean;
    className?: string;
};

/**
 * Button styling for elements that must not be a `<button>` — a download
 * `<a>` or a file-input `<label>`.
 */
export const useButtonClassName = ({
    size: sizeProp,
    variant,
    primary,
    secondary,
    warn,
    disabled,
    fullWidth,
    fitContent,
    bottom,
    marginTop,
    corner,
    iconOnly,
    className
}: ButtonClassNameInput): string => {
    const theme = useTheme();
    const isFullWidth = theme?.displayType === 'full-width';

    // Match the legacy default: full-width shells size buttons at "small"
    // when the caller doesn't specify one.
    const size = sizeProp ?? (isFullWidth ? 'small' : 'medium');

    const fontClass = isFullWidth
        ? size === 'small'
            ? 'text-body2'
            : 'text-body1'
        : size === 'small'
        ? 'text-label2'
        : 'text-label1';

    const cornerClass = corner
        ? CORNER_CLASS[corner]
        : isFullWidth
        ? 'rounded-extraSmall' //   8px shell variant
        : size === 'small'
        ? 'rounded-full' //         pill at h-36
        : 'rounded-medium'; //      16px

    const variantClass = VARIANT_CLASS[resolveVariant({ variant, primary, secondary, warn })];

    const widthClass =
        // Square sizing wins over the width modifiers — an icon-only button
        // is intrinsically square.
        iconOnly ? '' : fullWidth ? 'box-border w-full' : fitContent ? 'w-fit' : 'w-auto';

    const sizeClass = iconOnly ? SIZE_BOX_ICON_ONLY[size] : SIZE_BOX[size];

    return cn(
        'relative flex shrink-0 flex-row items-center justify-center gap-2 border-0 font-sans not-italic no-underline outline-0 transition-colors',
        'focus-visible:outline focus-visible:outline-1 focus-visible:outline-textPrimary',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        bottom && 'mb-4',
        marginTop && 'mt-4',
        widthClass,
        sizeClass,
        fontClass,
        cornerClass,
        variantClass,
        className
    );
};

type ButtonElementProps = ButtonClassNameInput &
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'>;

export const ButtonElement = forwardRef<HTMLButtonElement, ButtonElementProps>(
    (
        {
            size,
            variant,
            primary,
            secondary,
            warn,
            disabled,
            fullWidth,
            fitContent,
            bottom,
            marginTop,
            corner,
            iconOnly,
            className,
            type = 'button',
            ...rest
        },
        ref
    ) => {
        const buttonClassName = useButtonClassName({
            size,
            variant,
            primary,
            secondary,
            warn,
            disabled,
            fullWidth,
            fitContent,
            bottom,
            marginTop,
            corner,
            iconOnly,
            className
        });

        return (
            <button
                ref={ref}
                type={type}
                disabled={disabled}
                className={buttonClassName}
                {...rest}
            />
        );
    }
);
ButtonElement.displayName = 'ButtonElement';

/**
 * Lays out a row of `Button`s with equal flex weights and 1rem spacing — kept
 * styled-components for the layout, but no longer references `ButtonElement`
 * as a selector (the new element isn't a styled component).
 */
export const ButtonRow = styled.div`
    display: flex;
    gap: 1rem;
    width: 100%;

    > button {
        flex: 1;
    }
`;

const IconSlot: FC<PropsWithChildren> = ({ children }) => (
    <span className="inline-flex shrink-0 items-center justify-center">{children}</span>
);

export const Button: FC<
    PropsWithChildren<
        ButtonProps & Omit<React.HTMLProps<HTMLButtonElement>, 'size' | 'children' | 'ref'>
    >
> = ({ children, loading, leftIcon, rightIcon, ...props }) => {
    const iconOnly = !children && !!leftIcon && !rightIcon;

    if (loading) {
        return (
            <ButtonElement {...props} iconOnly={iconOnly} disabled>
                {/* Reserve the intrinsic content width so the button doesn't
                    resize when flipping between idle and loading states. */}
                <span className="invisible inline-flex items-center gap-2">
                    {leftIcon && <IconSlot>{leftIcon}</IconSlot>}
                    {children}
                    {rightIcon && <IconSlot>{rightIcon}</IconSlot>}
                </span>
                <Loader
                    size="small"
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                />
            </ButtonElement>
        );
    }
    return (
        <ButtonElement {...props} iconOnly={iconOnly}>
            {leftIcon && <IconSlot>{leftIcon}</IconSlot>}
            {children}
            {rightIcon && <IconSlot>{rightIcon}</IconSlot>}
        </ButtonElement>
    );
};

export const ButtonResponsiveSize: FC<Omit<ComponentProps<typeof Button>, 'size'>> = props => {
    const theme = useTheme();
    return <Button {...props} size={theme.proDisplayType === 'desktop' ? 'small' : 'large'} />;
};

/**
 * Flat text "button" — Label2, accent-blue, no chrome. Used for inline links
 * and "Open" / "Edit" affordances. `styled(ButtonFlat)` wrappers in callers
 * keep working because the underlying `<button>` forwards `className`.
 */
export const ButtonFlat = forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, type = 'button', ...rest }, ref) => (
    <button
        ref={ref}
        type={type}
        className={cn(
            'border-0 bg-transparent p-0 text-label2 text-accentBlue opacity-100 transition-opacity duration-150 ease-in-out active:opacity-80',
            className
        )}
        {...rest}
    />
));
ButtonFlat.displayName = 'ButtonFlat';
