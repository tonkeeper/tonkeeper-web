import { FC } from 'react';

import { WalletEmoji } from '../../../../components/shared/emoji/WalletEmoji';
import { cn } from '../../../../libs/css';
import { useWalletColor } from '../../../../state/walletColor';

/**
 * Account avatar: the wallet's emoji on a circle filled with its colour.
 * The glyph is sized to roughly half the circle, matching the design
 * library's 24-in-44 proportion at every size the lists use.
 */
export const WalletAvatar: FC<{
    accountId: string;
    emoji?: string;
    /** Circle diameter in px. */
    size?: number;
    /**
     * Show this colour instead of the account's saved one — for the
     * Customize screen's live preview of an unsaved pick.
     */
    colorHex?: string;
    className?: string;
}> = ({ accountId, emoji, size = 44, colorHex, className }) => {
    const savedColor = useWalletColor(accountId);
    const glyph = Math.round(size * 0.55);

    return (
        <div
            style={{ backgroundColor: colorHex ?? savedColor.hex, width: size, height: size }}
            className={cn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-full',
                className
            )}
        >
            <WalletEmoji
                emoji={emoji}
                emojiSize={`${glyph}px`}
                containerSize={`${glyph}px`}
                className="text-constantWhite"
            />
        </div>
    );
};
