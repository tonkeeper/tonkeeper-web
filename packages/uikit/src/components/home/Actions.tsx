import React, { FC, PropsWithChildren, useContext, useLayoutEffect, useRef, useState } from 'react';
import { AppSelectionContext, useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useAnalyticsTrack } from '../../hooks/analytics';
import { cn } from '../../libs/css';
import { IconButton } from '../IconButton';

/**
 * App-level home actions (Buy / Send / Receive / Sell / Swap). These are NOT
 * UI-kit parts — `Action` composes the design-system `IconButton` with analytics,
 * the SDK and i18n, and drives the hover state from `AppSelectionContext` on iOS
 * (where there is no CSS `:hover`). `ActionsRow` lays them out.
 */

interface ActionProps {
    icon: React.ReactNode;
    title: string;
    disabled?: boolean;
    action: () => void;
}

export const Action: FC<ActionProps> = ({ icon, title, disabled, action }) => {
    const track = useAnalyticsTrack();
    const { t } = useTranslation();
    const selection = useContext(AppSelectionContext);
    const { ios } = useAppContext();
    const [isHover, setHover] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (selection && ref.current && ref.current.contains(selection as Node)) {
            setHover(true);
        } else {
            setHover(false);
        }
    }, [selection, setHover]);

    const onClick = () => {
        if (disabled) return;

        track('Action', { kind: title });
        action();
    };

    return (
        <IconButton
            ref={ref}
            icon={icon}
            label={t(title)}
            disabled={disabled}
            hovered={ios && isHover}
            onClick={onClick}
        />
    );
};

export const ActionsRow: FC<PropsWithChildren<{ className?: string }>> = ({
    className,
    children
}) => (
    // Buttons sit edge to edge at 76px and shrink equally when five don't fit a
    // phone width; a label wider than its shrunk button overflows centred.
    <div
        className={cn(
            'mb-8 flex flex-row items-center justify-center [&>*]:w-[76px] [&>*]:min-w-0 [&>*]:shrink',
            className
        )}
    >
        {children}
    </div>
);
