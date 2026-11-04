import { emojis } from '@tonkeeper/core/dist/utils/emojis';
import { FC, memo, useEffect, useState } from 'react';

import { emojiIcons } from './emojiIcons';

/**
 * Scrollable emoji grid used by the wallet-customize step. The icon
 * cells (`.emoji-button`) are deliberately *not* styled-components: an
 * inline class kept rendering of the ~1700-item list cheap on legacy
 * styled-components. With Tailwind that's no longer a concern — each
 * cell is a plain `<div className="…">` and the grid still benefits
 * from `React.memo` on the parent.
 *
 * The top and bottom shadow strips fade the list edges into
 * `backgroundPage`, matching the modal sheet color so the list reads
 * as scroll-bounded without a hard line.
 */
const shortEmojisList = emojis.slice(0, 150);

const cellClass = 'flex h-8 w-8 cursor-pointer items-center justify-center text-2xl leading-6';

export const EmojisList: FC<{
    onClick: (emoji: string) => void;
    keepShortListForMS?: number;
}> = memo(({ onClick, keepShortListForMS }) => {
    const [emojisList, setEmojisList] = useState(keepShortListForMS ? shortEmojisList : emojis);

    useEffect(() => {
        if (keepShortListForMS) {
            const timer = setTimeout(() => setEmojisList(emojis), keepShortListForMS);
            return () => clearTimeout(timer);
        }
    }, [keepShortListForMS]);

    return (
        <div className="relative flex max-h-[240px] flex-wrap items-center overflow-auto outline-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="sticky top-0 h-4 w-full bg-gradient-to-b from-backgroundPage to-transparent" />
            {emojiIcons.map(item => (
                <div className={cellClass} key={item.name} onClick={() => onClick(item.name)}>
                    <item.icon />
                </div>
            ))}
            {emojisList.map(emoji => (
                <div className={cellClass} key={emoji} onClick={() => onClick(emoji)}>
                    {emoji}
                </div>
            ))}
            <div className="sticky -bottom-px h-4 w-full bg-gradient-to-t from-backgroundPage to-transparent" />
        </div>
    );
});
EmojisList.displayName = 'EmojisList';
