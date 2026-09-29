import { FC, ReactNode } from 'react';
import { cn } from '../utils/cn';
import IcSwitch16 from '../icons/components/IcSwitch16';

export interface TokenSwitchProps {
    /** 24px token icon. */
    icon: ReactNode;
    /** Optional small chain badge overlaid at the icon's bottom-right (token assets). */
    chainBadge?: ReactNode;
    symbol: string;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Pill that shows the selected asset and opens the asset switcher. Token
 * assets carry a small chain badge to
 * disambiguate same-symbol tokens across chains.
 */
export const TokenSwitch: FC<TokenSwitchProps> = ({
    icon,
    chainBadge,
    symbol,
    onClick,
    disabled,
    className
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
            'flex items-center gap-1.5 rounded-full bg-buttonTertiaryBackground py-2 pl-2 pr-3 text-buttonTertiaryForeground pressable',
            disabled
                ? 'cursor-not-allowed opacity-[0.48]'
                : 'cursor-pointer hover:bg-buttonTertiaryBackgroundHighlighted',
            className
        )}
    >
        <span className="relative inline-block h-6 w-6">
            <span className="block h-6 w-6 overflow-hidden rounded-xl [&>img]:h-6 [&>img]:w-6 [&>svg]:h-6 [&>svg]:w-6">
                {icon}
            </span>
            {chainBadge && (
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 overflow-hidden rounded-full ring-2 ring-buttonTertiaryBackground [&>img]:h-3 [&>img]:w-3 [&>svg]:h-3 [&>svg]:w-3">
                    {chainBadge}
                </span>
            )}
        </span>
        <span className="text-label2">{symbol}</span>
        <IcSwitch16 className="h-4 w-4 text-iconSecondary" />
    </button>
);
