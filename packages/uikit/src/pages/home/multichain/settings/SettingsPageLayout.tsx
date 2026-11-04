import { FC, ReactNode } from 'react';

import { cn } from '../../../../libs/css';
import { BackButton } from '../../../../primitives/BackButton';

/**
 * Chrome shared by the settings screens: page background plus an optional
 * header (back button + centered title and subtitle). The main settings
 * screen on desktop renders without a header — the shell's tab bar is the
 * way out — so callers can drop it via `header={false}`.
 */
export const SettingsPageLayout: FC<{
    compact?: boolean;
    title?: string;
    subtitle?: ReactNode;
    header?: boolean;
    onBack?: () => void;
    children: ReactNode;
}> = ({ compact = false, title, subtitle, header = true, onBack, children }) => {
    return (
        <div
            className={cn(
                'flex flex-col bg-backgroundPage',
                compact ? 'min-h-full' : 'min-h-screen'
            )}
        >
            {header && (
                <header className="relative flex h-16 shrink-0 items-center justify-center px-16">
                    {onBack && (
                        <BackButton
                            onClick={onBack}
                            className="absolute left-2 top-1/2 -translate-y-1/2"
                        />
                    )}
                    <div className="flex min-w-0 flex-col items-center">
                        {title && <div className="truncate text-h3 text-textPrimary">{title}</div>}
                        {subtitle && (
                            <div className="flex max-w-full items-center gap-1 text-body2 text-textSecondary">
                                {subtitle}
                            </div>
                        )}
                    </div>
                </header>
            )}
            {children}
        </div>
    );
};
