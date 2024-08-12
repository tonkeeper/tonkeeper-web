import { Body2 } from '../Text';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import { Dot } from '../Dot';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { useActiveAccount, useActiveTonNetwork } from '../../state/wallet';
import { FC } from 'react';
import { TonWalletStandard, WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { AccountAndWalletBadgesGroup } from './AccountBadge';
import { useTranslation } from '../../hooks/translation';
import styled from 'styled-components';
import type { AllOrNone } from '@tonkeeper/core/dist/utils/types';

const WalletInfoStyled = styled.div`
    overflow: hidden;
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

export const AccountAndWalletInfo: FC<
    AllOrNone<{ account: Account; walletId: WalletId }> & {
        noPrefix?: boolean;
        hideAddress?: boolean;
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

    return (
        <WalletInfoStyled>
            <NameText>
                {!props.noPrefix && <>{t('confirmSendModal_wallet')}&nbsp;</>}
                {account.name}
            </NameText>
            <WalletEmoji emojiSize="20px" containerSize="20px" emoji={account.emoji} />
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
