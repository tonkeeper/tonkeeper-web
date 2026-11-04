import { FC } from 'react';

import { WALLET_COLORS } from '@tonkeeper/core/dist/entries/walletColor';

import { cn } from '../../libs/css';

/**
 * Horizontally scrolling row of the palette's colours, the selected one
 * ringed. Scrolls rather than wraps so the row keeps a fixed height above
 * the emoji grid on the Customize screen.
 */
export const WalletColorPicker: FC<{
    value: string;
    onChange: (colorId: string) => void;
}> = ({ value, onChange }) => (
    <div className="hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-1">
        {WALLET_COLORS.map(color => (
            <button
                key={color.id}
                type="button"
                aria-label={color.name}
                aria-pressed={color.id === value}
                onClick={() => onChange(color.id)}
                style={{ backgroundColor: color.hex }}
                className={cn(
                    'size-8 shrink-0 cursor-pointer rounded-full ring-offset-2 ring-offset-backgroundPage transition-shadow',
                    color.id === value
                        ? 'ring-2 ring-textPrimary'
                        : // Half-strength preview of the selected ring.
                          'hover:ring-2 hover:ring-textSecondary'
                )}
            />
        ))}
    </div>
);
