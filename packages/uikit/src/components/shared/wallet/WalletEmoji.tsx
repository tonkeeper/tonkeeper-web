import { FC } from 'react';
import { emojiIcons } from '../../settings/wallet-name/emojiIcons';
import styled from 'styled-components';

const EmojiWrapper = styled.div`
    height: 32px;
    width: 32px;
    line-height: 24px;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const WalletEmoji: FC<{ emoji: string; className?: string }> = ({ emoji, className }) => {
    if (emoji.startsWith('custom:')) {
        const Emoji = emojiIcons.find(icon => icon.name === emoji);

        if (!Emoji) {
            return null;
        }

        return (
            <EmojiWrapper className={className}>
                <Emoji.icon />
            </EmojiWrapper>
        );
    }

    return <EmojiWrapper className={className}>{emoji}</EmojiWrapper>;
};
