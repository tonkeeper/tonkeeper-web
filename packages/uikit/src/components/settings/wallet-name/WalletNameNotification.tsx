import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '../../../hooks/translation';
import { useMutateRenameWallet } from '../../../state/wallet';
import { Notification, NotificationBlock } from '../../Notification';
import { Button } from '../../fields/Button';
import { Input } from '../../fields/Input';
import styled from 'styled-components';
import { emojis } from './emojis';

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

const EmojiWrapper = styled.div`
    height: 32px;
    width: 32px;
    line-height: 24px;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const EmojiButton = styled(EmojiWrapper)`
    cursor: pointer;
`;

const shortEmojisList = emojis.slice(0, 150);

const EmojisList: FC<{ onClick: (emoji: string) => void; keepShortListForMS?: number }> =
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
                {emojisList.map(emoji => (
                    <EmojiButton key={emoji} onClick={() => onClick(emoji)}>
                        {emoji}
                    </EmojiButton>
                ))}
                <ShadowBottom />
            </EmojisListScroll>
        );
    });

const RenameWalletContent: FC<{
    wallet: WalletState;
    afterClose: (action: () => void) => void;
    animationTime?: number;
}> = ({ animationTime, afterClose, wallet }) => {
    const { t } = useTranslation();

    const { mutateAsync, isLoading, isError } = useMutateRenameWallet(wallet);

    const [name, setName] = useState(wallet.name ?? '');
    const [emoji, setEmoji] = useState(wallet.emoji ?? '');
    const onSubmit: React.FormEventHandler<HTMLFormElement> = async e => {
        e.preventDefault();
        await mutateAsync({ name, emoji });
        afterClose(() => null);
    };

    const address = formatAddress(wallet.active.rawAddress, wallet.network);

    return (
        <NotificationBlock onSubmit={onSubmit}>
            <Input value={address} disabled label={t('add_edit_favorite_address_label')} />
            <Input
                value={name}
                onChange={setName}
                isValid={!isError}
                label={t('Wallet_name')}
                rightElement={emoji ? <EmojiWrapper>{emoji}</EmojiWrapper> : null}
                marginRight="36px"
            />
            <EmojisList keepShortListForMS={animationTime} onClick={setEmoji} />

            <Button
                size="large"
                fullWidth
                marginTop
                primary
                loading={isLoading}
                disabled={isLoading}
                type="submit"
            >
                {t('add_edit_favorite_save')}
            </Button>
        </NotificationBlock>
    );
};

export const RenameWalletNotification: FC<{
    wallet?: WalletState;
    handleClose: () => void;
}> = ({ wallet, handleClose }) => {
    const { t } = useTranslation();

    const Content = useCallback(
        (afterClose: (action: () => void) => void) => {
            if (!wallet) return undefined;
            return (
                <RenameWalletContent animationTime={1000} wallet={wallet} afterClose={afterClose} />
            );
        },
        [wallet]
    );

    return (
        <Notification
            isOpen={wallet != null}
            handleClose={handleClose}
            hideButton
            title={t('Rename')}
        >
            {Content}
        </Notification>
    );
};
