import { FC } from 'react';
import styled from 'styled-components';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';

import { Body2 } from '../Text';
import { ListItem, ListItemPayload } from '../List';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import { WalletVersionBadge } from '../account/AccountBadge';
import { getAccountWalletNameAndEmoji, useActiveTonNetwork } from '../../state/wallet';

interface IProWalletListItemProps {
    account: Account;
    wallet: TonWalletStandard;
    rightElement?: React.ReactNode;
    disableHover?: boolean;
    onClick?: () => void;
}

export const ProWalletListItem: FC<IProWalletListItemProps> = props => {
    const { account, wallet, rightElement, disableHover = false, onClick } = props;

    const network = useActiveTonNetwork();
    const address = toShortValue(formatAddress(wallet.rawAddress, network)).slice(4);
    const { name, emoji } = getAccountWalletNameAndEmoji(account);

    return (
        <ListItemStyled hover={!disableHover} onClick={onClick}>
            <ListItemPayloadStyled>
                <WalletEmojiStyled containerSize="16px" emojiSize="16px" emoji={emoji} />
                <Body2Limited>{name}</Body2Limited>
                <Body2Styled>&nbsp;{address}</Body2Styled>
                <WalletBadgeStyled walletVersion={wallet.version} />
                {rightElement}
            </ListItemPayloadStyled>
        </ListItemStyled>
    );
};

const Body2Limited = styled(Body2)`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const Body2Styled = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

const WalletEmojiStyled = styled(WalletEmoji)`
    margin-right: 12px;
    display: inline-flex;
`;

const WalletBadgeStyled = styled(WalletVersionBadge)`
    display: inline-block;
    margin-left: 6px;
    width: fit-content;
    height: 20px;
    line-height: 16px;
`;

const ListItemStyled = styled(ListItem)`
    &:not(:first-child) > div {
        padding-top: 10px;
    }
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    display: grid;
    grid-template-columns: auto minmax(0, max-content) auto 1fr auto;
    align-items: baseline;
    justify-content: left;
    gap: 0;
    padding-top: 10px;
    padding-bottom: 10px;
`;
