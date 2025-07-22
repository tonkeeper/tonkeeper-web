import { FC, ReactNode, useId } from 'react';
import styled from 'styled-components';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { TonWalletStandard, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';

import { Body2 } from '../Text';
import { ListItem, ListItemPayload } from '../List';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import { WalletVersionBadge } from '../account/AccountBadge';
import { getAccountWalletNameAndEmoji, useActiveTonNetwork } from '../../state/wallet';
import { Skeleton } from '../shared/Skeleton';

interface IProWalletListItemProps {
    account?: Account;
    wallet?: TonWalletStandard;
    isLoading?: boolean;
    rightElement?: ReactNode;
    disableHover?: boolean;
    onClick?: () => void;
}

export const ProWalletListItem: FC<IProWalletListItemProps> = props => {
    const { account, wallet, rightElement, disableHover = false, isLoading, onClick } = props;

    const skeletonId = useId();
    const network = useActiveTonNetwork();

    if (isLoading || !account || !wallet) {
        return (
            <ListItemStyled hover={false} skeletonId={skeletonId}>
                <ListItemPayloadStyled>
                    <WalletEmojiStyled containerSize="16px" emojiSize="16px" emoji={'😃'} />
                    <Body2Limited>{'Skeleton'}</Body2Limited>
                    <Body2Styled>&nbsp;{'Skeleton'}</Body2Styled>
                    <WalletBadgeStyled walletVersion={WalletVersion.V5_BETA} />
                </ListItemPayloadStyled>
                <StyledSkeleton id={skeletonId} />
            </ListItemStyled>
        );
    }
    const address = toShortValue(formatAddress(wallet.rawAddress, network)).slice(4);
    const { name, emoji } = getAccountWalletNameAndEmoji(account, wallet.id);

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

const StyledSkeleton = styled(Skeleton)`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
`;

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
`;

const ListItemStyled = styled(ListItem)<{ skeletonId?: string }>`
    opacity: 1;
    visibility: visible;

    &:not(:first-child) > div {
        padding-top: 10px;
    }

    ${props =>
        props.skeletonId
            ? `
        & > *:not([id="${props.skeletonId}"]) {
            opacity: 0;
            visibility: hidden;
        }
        `
            : ''}
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
