import { IonFooter, IonToolbar } from '@ionic/react';
import styled from 'styled-components';
import { useActiveAccount } from '../../../state/wallet';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { Body3, Label2, Label2Class } from '../../Text';
import { useMenuController } from '../../../hooks/ionic';
import { useTranslation } from '../../../hooks/translation';
import { AccountAndWalletBadgesGroup } from '../../account/AccountBadge';
import { useWalletTotalBalance } from '../../../state/asset';
import { useUserFiat } from '../../../state/fiat';
import { Skeleton } from '../../shared/Skeleton';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { AppRoute } from '../../../libs/routes';

const footerHeight = '64px';

const FooterContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    height: ${footerHeight};
`;

const AccountMenuLine1 = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
`;

const AccountMenuLine2 = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
    width: fit-content;
`;

const AccountMenuWrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const IonToolbarStyled = styled(IonToolbar)`
    height: ${footerHeight};
    padding-bottom: max(10px, env(safe-area-inset-bottom, 0px)) !important;
    box-sizing: content-box;
`;

const IonFooterStyled = styled(IonFooter)`
    position: fixed;
    bottom: 0;
    height: calc(${footerHeight} + env(safe-area-inset-bottom, 0px)) !important;
    box-sizing: content-box;
`;

const Body3Styled = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

export const MobileProFooter = () => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const leftMenuController = useMenuController('aside-nav');
    const rightMenuController = useMenuController('wallet-nav');
    const navigate = useNavigate();

    const { data: balance, isLoading } = useWalletTotalBalance();
    const fiat = useUserFiat();

    const name = account.type === 'mam' ? account.activeDerivation.name : account.name;
    const emoji = account.type === 'mam' ? account.activeDerivation.emoji : account.emoji;
    return (
        <IonFooterStyled translucent={true}>
            <IonToolbarStyled>
                <FooterContainer>
                    <TabButton onClick={() => leftMenuController.open()}>
                        {t('pro_mobile_footer_left_tab_button')}
                    </TabButton>
                    <AccountMenuWrapper>
                        <AccountMenuLine1 onClick={() => navigate(AppRoute.home)}>
                            <WalletEmoji emoji={emoji} emojiSize="14px" containerSize="14px" />
                            <Label2>{name}</Label2>
                        </AccountMenuLine1>
                        <AccountMenuLine2>
                            {isLoading ? (
                                <Skeleton width="60px" height="16px" />
                            ) : (
                                <Body3Styled>{formatFiatCurrency(fiat, balance || 0)}</Body3Styled>
                            )}
                            <AccountAndWalletBadgesGroup
                                account={account}
                                walletId={account.activeTonWallet.id}
                            />
                        </AccountMenuLine2>
                    </AccountMenuWrapper>
                    <TabButton onClick={() => rightMenuController.open()}>
                        {t('pro_mobile_footer_right_tab_button')}
                    </TabButton>
                </FooterContainer>
            </IonToolbarStyled>
        </IonFooterStyled>
    );
};

const TabButton = styled.div`
    padding: 11px 16px;
    ${Label2Class};
    border-radius: ${p => p.theme.corner2xSmall};
    border: 1px solid ${p => p.theme.separatorCommon};
`;
