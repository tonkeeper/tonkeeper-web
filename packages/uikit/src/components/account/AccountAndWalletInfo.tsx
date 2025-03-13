import { Body2 } from '../Text';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import { Dot } from '../Dot';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { useActiveAccount, useActiveTonNetwork } from '../../state/wallet';
import { FC } from 'react';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { AccountAndWalletBadgesGroup } from './AccountBadge';
import { useTranslation } from '../../hooks/translation';
import styled from 'styled-components';
import type { AllOrNone } from '@tonkeeper/core/dist/utils/types';

const WalletInfoStyled = styled.div`
    position: relative;
    overflow: visible;
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${p => p.theme.textSecondary};
`;

const NameText = styled(Body2)`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const AddressText = styled(Body2)`
    flex-shrink: 0;
    color: ${p => p.theme.textTertiary};
`;

const WalletEmojiStyled = styled(WalletEmoji)`
    margin-right: 4px;
`;

/**
 * Hack to prevent Safari emoji borders cutting out
 */
const EmojiContainer = styled.div`
    display: block;
    width: 20px;
    height: 20px;
    margin-right: 4px;

    > * {
        position: absolute;
        top: 0;
        left: 0;
    }
`;

export const AccountAndWalletInfo: FC<
    AllOrNone<{ account: Account; walletId: WalletId }> & {
        noPrefix?: boolean;
        hideAddress?: boolean;
        className?: string;
        onClick?: () => void;
    }
> = props => {
    const { t } = useTranslation();
    let account: Account = useActiveAccount();
    let wallet = account.activeTonWallet;
    const network = useActiveTonNetwork();

    if ('account' in props && props.account) {
        account = props.account;
        wallet = account.getTonWallet(props.walletId)!;
    }

    let name = account.name;
    let emoji = account.emoji;

    if (account.type === 'mam') {
        const derivation = account.getTonWalletsDerivation(wallet.id);
        if (derivation) {
            name = derivation.name;
            emoji = derivation.emoji;
        }
    }

    return (
        <WalletInfoStyled className={props.className} onClick={props.onClick}>
            <EmojiContainer>
                <WalletEmojiStyled emojiSize="20px" containerSize="20px" emoji={emoji} />
            </EmojiContainer>
            <NameText>
                {!props.noPrefix && <>{t('confirmSendModal_wallet')}&nbsp;</>}
                {name}
            </NameText>
            {account.allTonWallets.length > 1 && !props.hideAddress ? (
                <>
                    <Dot />
                    <AddressText>
                        {toShortValue(formatAddress(wallet.rawAddress, network))}
                    </AddressText>
                    <AccountAndWalletBadgesGroup account={account} walletId={wallet.id} />
                </>
            ) : (
                <AccountAndWalletBadgesGroup account={account} walletId={wallet.id} />
            )}
        </WalletInfoStyled>
    );
};
