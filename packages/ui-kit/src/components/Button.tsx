import React, { FC, PropsWithChildren, ReactNode, forwardRef } from 'react';
import { cn } from '../utils/cn';
import { Loader, LoaderSize } from './Loader';

export type ButtonVariant =
    | 'primaryBlue'
    | 'primaryGreen'
    | 'primaryRed'
    | 'secondary'
    | 'tertiary'
    | 'destructive'
    | 'overlay';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps
    extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'children'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    loading?: boolean;
    fullWidth?: boolean;
}

const SIZE_BOX: Record<ButtonSize, string> = {
    small: 'h-9 px-4 rounded-full text-label2',
    medium: 'h-12 px-5 rounded-full text-label1',
    large: 'h-14 px-6 rounded-medium text-label1'
};

const SIZE_BOX_ICON_ONLY: Record<ButtonSize, string> = {
    small: 'h-9 w-9 px-0 rounded-full text-label2',
    medium: 'h-12 w-12 px-0 rounded-full text-label1',
    large: 'h-14 w-14 px-0 rounded-medium text-label1'
};

const LOADER_SIZE: Record<ButtonSize, LoaderSize> = {
    small: 'small',
    medium: 'small',
    large: 'medium'
};

const VARIANT_CLASS: Record<ButtonVariant, string> = {
    primaryBlue:
        'bg-buttonPrimaryBackground text-buttonPrimaryForeground hover:enabled:bg-buttonPrimaryBackgroundHighlighted disabled:bg-buttonPrimaryBackgroundDisabled',
    primaryGreen:
        'bg-buttonPrimaryBackgroundGreen text-buttonPrimaryForeground hover:enabled:bg-buttonPrimaryBackgroundGreenHighlighted disabled:bg-buttonPrimaryBackgroundGreenDisabled',
    primaryRed:
        'bg-buttonPrimaryBackgroundRed text-buttonPrimaryForeground hover:enabled:bg-buttonPrimaryBackgroundRedHighlighted disabled:bg-buttonPrimaryBackgroundRedDisabled',
    secondary:
        'bg-buttonSecondaryBackground text-buttonSecondaryForeground hover:enabled:bg-buttonSecondaryBackgroundHighlighted disabled:bg-buttonSecondaryBackgroundDisabled',
    tertiary:
        'bg-buttonTertiaryBackground text-buttonTertiaryForeground hover:enabled:bg-buttonTertiaryBackgroundHighlighted disabled:bg-buttonTertiaryBackgroundDisabled',
    // Destructive uses a tinted overlay at 16% (Active) / 12% (Highlighted)
    // opacity. `isolate` keeps the ::before below the label without leaking
    // into the outer stacking context.
    destructive:
        'isolate bg-transparent text-accentRed ' +
        'before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-accentRed before:opacity-[0.16] before:transition-opacity ' +
        'hover:enabled:before:opacity-[0.12]',
    // No Highlighted token exists for a constant-white surface, so hover darkens
    // it with a black wash on the same ::before layer destructive uses.
    overlay:
        'isolate bg-constantWhite text-constantBlack ' +
        'before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-constantBlack before:opacity-0 before:transition-opacity ' +
        'hover:enabled:before:opacity-[0.08]'
};

const IconSlot: FC<PropsWithChildren> = ({ children }) => (
    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">
        {children}
    </span>
);

interface ButtonClassesInput {
    variant: ButtonVariant;
    size: ButtonSize;
    fullWidth?: boolean;
    iconOnly?: boolean;
    disabled?: boolean;
    className?: string;
}

export const buttonClasses = ({
    variant,
    size,
    fullWidth,
    iconOnly,
    disabled,
    className
}: ButtonClassesInput): string => {
    const widthClass = iconOnly ? '' : fullWidth ? 'box-border w-full' : 'w-auto';
    const sizeClass = iconOnly ? SIZE_BOX_ICON_ONLY[size] : SIZE_BOX[size];

    return cn(
        'relative flex shrink-0 flex-row items-center justify-center gap-2 border-0 font-sans not-italic outline-0 pressable',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        widthClass,
        sizeClass,
        VARIANT_CLASS[variant],
        className
    );
};

export const Button = forwardRef<HTMLButtonElement, PropsWithChildren<ButtonProps>>(
    (
        {
            variant = 'tertiary',
            size = 'medium',
            leftIcon,
            rightIcon,
            loading,
            disabled,
            fullWidth,
            type = 'button',
            className,
            children,
            ...rest
        },
        ref
    ) => {
        const iconOnly = !children && !!leftIcon && !rightIcon;
        const isDisabled = !!disabled || !!loading;

        return (
            <button
                ref={ref}
                type={type}
                disabled={isDisabled}
                className={cn(
                    buttonClasses({
                        variant,
                        size,
                        fullWidth,
                        iconOnly,
                        disabled: isDisabled,
                        className
                    }),
                    'group'
                )}
                {...rest}
            >
                <span
                    className={cn(
                        'inline-flex items-center gap-2',
                        // Content (text + icons) fades to 48% when the button is
                        // disabled; background stays opaque. Pseudo-element bg
                        // tint on `destructive` is on the button, not in here.
                        'group-disabled:opacity-[0.48]',
                        loading && 'invisible'
                    )}
                >
                    {leftIcon && <IconSlot>{leftIcon}</IconSlot>}
                    {children}
                    {rightIcon && <IconSlot>{rightIcon}</IconSlot>}
                </span>
                {loading && (
                    <Loader
                        size={LOADER_SIZE[size]}
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    />
                )}
            </button>
        );
    }
);
Button.displayName = 'Button';
