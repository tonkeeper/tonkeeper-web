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
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${p => p.theme.textSecondary};

    > ${Body2} {
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const Body2Tertiary = styled(Body2)`
    color: ${p => p.theme.textTertiary};
`;

export const AccountAndWalletInfo: FC<
    AllOrNone<{ account: Account; walletId: WalletId }>
> = props => {
    const { t } = useTranslation();
    let account: Account = useActiveAccount();
    let wallet: TonWalletStandard = account.activeTonWallet;
    const network = useActiveTonNetwork();

    if ('account' in props && props.account) {
        account = props.account;
        wallet = account.getTonWallet(props.walletId)!;
    }

    return (
        <WalletInfoStyled>
            <Body2>
                {t('confirmSendModal_wallet')}&nbsp;
                {account.name}
            </Body2>
            <WalletEmoji emojiSize="20px" containerSize="20px" emoji={account.emoji} />
            {account.allTonWallets.length > 1 ? (
                <>
                    <Dot />
                    <Body2Tertiary>
                        {toShortValue(formatAddress(wallet.rawAddress, network))}
                    </Body2Tertiary>
                    <AccountAndWalletBadgesGroup account={account} walletId={wallet.id} />
                </>
            ) : (
                <AccountAndWalletBadgesGroup account={account} walletId={wallet.id} />
            )}
        </WalletInfoStyled>
    );
};
