import React, { FC, useEffect, useState } from 'react';
import { useTheme } from 'styled-components';
import { useAppSdk } from '../hooks/appSdk';
import { cn } from '../libs/css';

export interface SwitchProps {
    checked: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    className?: string;
}

// Defer enabling the transition until after the first paint so an initially-on
// switch doesn't slide in on mount.
const useActive = () => {
    const [active, setActive] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => setActive(true), 0);
        return () => clearTimeout(timeout);
    }, []);
    return active;
};

export const Switch: FC<SwitchProps> = React.memo(({ checked, onChange, disabled, className }) => {
    const active = useActive();
    const sdk = useAppSdk();
    const { proDisplayType } = useTheme();

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            className={cn(
                '-my-[5px] relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full border-0 p-0 align-middle',
                active && 'transition-colors duration-200 ease-in-out',
                checked ? 'bg-buttonPrimaryBackground' : 'bg-buttonTertiaryBackground',
                disabled && 'cursor-not-allowed opacity-[0.64]',
                proDisplayType === 'desktop' && 'scale-[0.64]',
                className
            )}
            onClick={e => {
                if (!disabled && onChange) {
                    e.stopPropagation();
                    onChange(!checked);
                    sdk.hapticNotification('impact_light');
                }
            }}
        >
            <span
                className={cn(
                    'pointer-events-none inline-block h-[27px] w-[27px] rounded-full bg-constantWhite shadow-[0_3px_8px_rgba(0,0,0,0.15),0_3px_1px_rgba(0,0,0,0.06)]',
                    active && 'transition-transform duration-200 ease-in-out',
                    checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
                )}
            />
        </button>
    );
});
Switch.displayName = 'Switch';
