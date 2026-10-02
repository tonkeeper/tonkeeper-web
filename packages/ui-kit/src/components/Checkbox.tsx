import { FC, PropsWithChildren } from 'react';
import IcDoneBold16 from '../icons/components/IcDoneBold16';
import { cn } from '../utils/cn';

export interface CheckboxProps {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    size?: 's' | 'm';
    className?: string;
}

const UNCHECKED_BORDER = 'border-textTertiary group-hover:border-textSecondary';

export const Checkbox: FC<PropsWithChildren<CheckboxProps>> = ({
    checked,
    onChange,
    disabled,
    children,
    className,
    size = 'm'
}) => (
    <div
        className={cn(
            'inline-flex items-center gap-2 align-top [-webkit-tap-highlight-color:transparent]',
            disabled ? 'cursor-not-allowed' : 'group cursor-pointer',
            className
        )}
        onClick={() => !disabled && onChange?.(!checked)}
    >
        <div
            className={cn(
                'box-border flex shrink-0 items-center justify-center rounded-[6px] border-2 transition-[color,background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] group-active:scale-95 group-active:duration-100 motion-reduce:group-active:scale-100',
                size === 's' ? 'h-[18px] w-[18px]' : 'h-[22px] w-[22px]',
                checked
                    ? 'border-buttonPrimaryBackground bg-buttonPrimaryBackground text-buttonPrimaryForeground group-hover:border-buttonPrimaryBackgroundHighlighted group-hover:bg-buttonPrimaryBackgroundHighlighted'
                    : cn(UNCHECKED_BORDER, 'bg-transparent text-transparent'),
                disabled && 'opacity-[0.48]'
            )}
        >
            {checked && <IcDoneBold16 className="h-4 w-4" />}
        </div>
        {children && <span className="text-body1 text-textPrimary">{children}</span>}
    </div>
);

export interface RadioProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    /** `check` fills the circle with a tick; `dot` shows a ring with a centred dot. */
    variant?: 'check' | 'dot';
    className?: string;
}

export const Radio: FC<PropsWithChildren<RadioProps>> = ({
    checked,
    onChange,
    disabled,
    className,
    children,
    variant = 'check'
}) => (
    <div
        className={cn(
            'inline-flex items-center gap-2 align-top [-webkit-tap-highlight-color:transparent]',
            disabled ? 'cursor-not-allowed' : 'group cursor-pointer',
            className
        )}
        onClick={() => !disabled && onChange?.(!checked)}
    >
        <div
            className={cn(
                'box-border flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full transition-transform duration-200 ease-[cubic-bezier(0.33,1,0.68,1)] group-active:scale-95 group-active:duration-100 motion-reduce:group-active:scale-100',
                disabled && 'opacity-[0.48]'
            )}
        >
            {variant === 'check' ? (
                checked ? (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-buttonPrimaryBackground text-buttonPrimaryForeground">
                        <IcDoneBold16 className="h-4 w-4" />
                    </div>
                ) : (
                    <div className={cn('h-full w-full rounded-full border-2', UNCHECKED_BORDER)} />
                )
            ) : (
                <div
                    className={cn(
                        'flex h-full w-full items-center justify-center rounded-full border-2',
                        checked ? 'border-buttonPrimaryBackground' : UNCHECKED_BORDER
                    )}
                >
                    {checked && (
                        <div className="h-[12px] w-[12px] rounded-full bg-buttonPrimaryBackground" />
                    )}
                </div>
            )}
        </div>
        {children && <span className="text-body1 text-textSecondary">{children}</span>}
    </div>
);
