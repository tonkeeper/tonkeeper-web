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
    overflow: visible !important;

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
    onClick?: () => void;
}> = ({ emoji, className, emojiSize, containerSize, onClick }) => {
    if (emoji?.startsWith('custom:')) {
        const Emoji = emojiIcons.find(icon => icon.name === emoji);

        if (!Emoji) {
            return null;
        }

        return (
            <EmojiWrapper
                emojiSize={emojiSize}
                containerSize={containerSize}
                className={className}
                onClick={onClick}
            >
                <Emoji.icon />
            </EmojiWrapper>
        );
    }

    return (
        <EmojiWrapper
            emojiSize={emojiSize}
            containerSize={containerSize}
            className={className}
            onClick={onClick}
        >
            {emoji}
        </EmojiWrapper>
    );
};
