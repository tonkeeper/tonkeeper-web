import { emojis } from '@tonkeeper/core/dist/utils/emojis';
import React, { FC, useEffect, useState } from 'react';
import { emojiIcons } from './emojiIcons';
import styled from 'styled-components';

const EmojisListScroll = styled.div`
    max-height: 240px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    overflow: auto;
    position: relative;

    &::-webkit-scrollbar {
        display: none;
        width: 0;
        background: transparent;
        height: 0;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;

    /* optimise large emojis list rendering avoiding styled components */
    > .emoji-button {
        height: 32px;
        width: 32px;
        line-height: 24px;
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }
`;

const Shadow = styled.div`
    position: sticky;
    width: 100%;
    height: 16px;
`;

const ShadowBottom = styled(Shadow)`
    bottom: -1px;
    background: ${props => props.theme.gradientBackgroundBottom};
`;

const ShadowTop = styled(Shadow)`
    top: 0;
    background: ${props => props.theme.gradientBackgroundTop};
`;

const shortEmojisList = emojis.slice(0, 150);

export const EmojisList: FC<{ onClick: (emoji: string) => void; keepShortListForMS?: number }> =
    React.memo(({ onClick, keepShortListForMS }) => {
        const [emojisList, setEmojisList] = useState(keepShortListForMS ? shortEmojisList : emojis);

        useEffect(() => {
            if (keepShortListForMS) {
                setTimeout(() => setEmojisList(emojis), keepShortListForMS);
            }
        }, []);

        return (
            <EmojisListScroll>
                <ShadowTop />
                {emojiIcons.map(item => (
                    <div
                        className="emoji-button"
                        key={item.name}
                        onClick={() => onClick(item.name)}
                    >
                        <item.icon />
                    </div>
                ))}
                {emojisList.map(emoji => (
                    <div className="emoji-button" key={emoji} onClick={() => onClick(emoji)}>
                        {emoji}
                    </div>
                ))}
                <ShadowBottom />
            </EmojisListScroll>
        );
    });
