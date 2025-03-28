import styled from 'styled-components';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { Body3, Label2 } from '../../Text';
import { useActiveAccount } from '../../../state/wallet';
import { useTranslation } from '../../../hooks/translation';
import { AccountBadge } from '../../account/AccountBadge';
import { MobileProHeaderContainer } from './MobileProHeaderElements';

const HeaderContainer = styled(MobileProHeaderContainer)`
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
`;

const TextContainer = styled.div`
    overflow: hidden;

    & ${Label2}, ${Body3} {
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
`;

const Body3Secondary = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const LabelWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;

    > *:last-child {
        flex-shrink: 0;
    }
`;

export const MobileProHeaderAccount = () => {
    const { t } = useTranslation();
    const account = useActiveAccount();

    if (account.type !== 'mam') {
        return <HeaderContainer />;
    }

    return (
        <HeaderContainer>
            <TextContainer>
                <LabelWrapper>
                    <Label2>{account.name || t('wallet_title')}</Label2>
                    <AccountBadge size="s" accountType={account.type} />
                </LabelWrapper>
                <Body3Secondary>
                    {t('aside_header_number_wallets', { number: account.derivations.length })}
                </Body3Secondary>
            </TextContainer>
            <WalletEmoji emoji={account.emoji} emojiSize="24px" containerSize="24px" />
        </HeaderContainer>
    );
};
