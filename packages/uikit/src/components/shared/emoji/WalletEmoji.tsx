import { FC } from 'react';
import styled from 'styled-components';
import { emojiIcons } from './emojiIcons';

const EmojiWrapper = styled.div<{ emojiSize?: string; containerSize?: string }>`
    height: ${p => p.containerSize || '32px'};
    min-height: ${p => p.containerSize || '32px'};
    width: ${p => p.containerSize || '32px'};
    min-width: ${p => p.containerSize || '32px'};
    font-size: ${p => p.emojiSize || '24px'};
    display: flex;
    align-items: center;
    justify-content: center;

    > svg {
        height: ${p => p.emojiSize || '24px'};
        width: ${p => p.emojiSize || '24px'};
    }
`;

export const WalletEmoji: FC<{
    emoji?: string;
    emojiSize?: string;
    containerSize?: string;
    className?: string;
}> = ({ emoji, className, emojiSize, containerSize }) => {
    if (emoji?.startsWith('custom:')) {
        const Emoji = emojiIcons.find(icon => icon.name === emoji);

        if (!Emoji) {
            return null;
        }

        return (
            <EmojiWrapper emojiSize={emojiSize} containerSize={containerSize} className={className}>
                <Emoji.icon />
            </EmojiWrapper>
        );
    }

    return (
        <EmojiWrapper emojiSize={emojiSize} containerSize={containerSize} className={className}>
            {emoji}
        </EmojiWrapper>
    );
};
