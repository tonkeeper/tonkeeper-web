import { FC } from 'react';

import { cn } from '../../../libs/css';
import { emojiIcons } from './emojiIcons';

/**
 * Renders the wallet-account avatar emoji. The `emoji` prop is either a
 * unicode character (rendered as text) or a `custom:<key>` token (rendered
 * as the matching SVG icon from `emojiIcons`).
 *
 * Sizes are arbitrary CSS values (`16px`, `24px`, `2rem`, …) rather than
 * a fixed scale, so they're passed through as inline styles and exposed
 * to the descendant `<svg>` through the `--emoji-icon-size` custom
 * property — the icon needs to override its intrinsic 24×24.
 */
export const WalletEmoji: FC<{
    emoji?: string;
    emojiSize?: string;
    containerSize?: string;
    className?: string;
    onClick?: () => void;
}> = ({ emoji, className, emojiSize = '24px', containerSize = '32px', onClick }) => {
    const style = {
        '--emoji-icon-size': emojiSize,
        width: containerSize,
        minWidth: containerSize,
        height: containerSize,
        minHeight: containerSize,
        fontSize: emojiSize
    };

    const wrapperClass = cn(
        'flex shrink-0 items-center justify-center overflow-visible',
        '[&>svg]:[width:var(--emoji-icon-size)] [&>svg]:[height:var(--emoji-icon-size)]',
        className
    );

    if (emoji?.startsWith('custom:')) {
        const Match = emojiIcons.find(icon => icon.name === emoji);
        if (!Match) return null;
        return (
            <div className={wrapperClass} style={style} onClick={onClick}>
                <Match.icon />
            </div>
        );
    }

    return (
        <div className={wrapperClass} style={style} onClick={onClick}>
            {emoji}
        </div>
    );
};
