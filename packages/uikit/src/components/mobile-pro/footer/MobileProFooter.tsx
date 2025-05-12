import { IonFooter, IonToolbar } from '@ionic/react';
import styled, { css } from 'styled-components';
import { useActiveAccount } from '../../../state/wallet';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { Body3, Label2, Label2Class } from '../../Text';
import { useMenuController } from '../../../hooks/ionic';
import { AccountAndWalletBadgesGroup } from '../../account/AccountBadge';
import { useWalletTotalBalance } from '../../../state/asset';
import { useUserFiat } from '../../../state/fiat';
import { Skeleton } from '../../shared/Skeleton';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { AppRoute } from '../../../libs/routes';
import { FC } from 'react';

const FooterContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    height: var(--footer-base-height);
`;

const AccountMenuLine1 = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;

    > * {
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
    }
`;

const AccountMenuLine2 = styled.div`
    display: flex;
    gap: 4px;
    align-items: center;
    width: fit-content;
    margin: 0 auto;
`;

const AccountMenuWrapper = styled.div`
    display: flex;
    flex-direction: column;
    overflow: hidden;
`;

const IonToolbarStyled = styled(IonToolbar)`
    height: var(--footer-base-height);
    padding-bottom: max(10px, env(safe-area-inset-bottom, 0px)) !important;
    box-sizing: content-box;
`;

const IonFooterStyled = styled(IonFooter)`
    position: fixed;
    bottom: 0;
    height: var(--footer-full-height);
    box-sizing: content-box;
`;

const Body3Styled = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

export const MobileProFooter = () => {
    const account = useActiveAccount();
    const leftMenuController = useMenuController('aside-nav');
    const rightMenuController = useMenuController('wallet-nav');
    const navigate = useNavigate();

    const { data: balance, isLoading } = useWalletTotalBalance();
    const fiat = useUserFiat();

    const onFooterClick = () => {
        leftMenuController.close();
        rightMenuController.close();
    };

    const name = account.type === 'mam' ? account.activeDerivation.name : account.name;
    const emoji = account.type === 'mam' ? account.activeDerivation.emoji : account.emoji;
    return (
        <IonFooterStyled translucent={true}>
            <IonToolbarStyled>
                <FooterContainer onClick={onFooterClick}>
                    <TabButton
                        onClick={e => {
                            e.stopPropagation();
                            if (leftMenuController.isOpen) {
                                leftMenuController.close();
                            } else {
                                leftMenuController.open();
                            }
                        }}
                    >
                        <LeftTabIcon $isActive={leftMenuController.isOpen} />
                    </TabButton>
                    <AccountMenuWrapper>
                        <AccountMenuLine1 onClick={() => navigate(AppRoute.home)}>
                            <WalletEmoji emoji={emoji} emojiSize="14px" containerSize="18px" />
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
                    <TabButton
                        onClick={e => {
                            e.stopPropagation();
                            if (rightMenuController.isOpen) {
                                rightMenuController.close();
                            } else {
                                rightMenuController.open();
                            }
                        }}
                    >
                        <RightTabIcon $isActive={rightMenuController.isOpen} />
                    </TabButton>
                </FooterContainer>
            </IonToolbarStyled>
        </IonFooterStyled>
    );
};

const TabButton = styled.div`
    padding: 0 16px;
    ${Label2Class};
    height: 100%;
    display: flex;
    align-items: center;
`;

const _LeftTabIcon: FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="28"
            viewBox="0 0 32 28"
            fill="none"
            className={className}
        >
            <g clipPath="url(#clip0_56590_303425)">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.653961 3.27606C0 4.55953 0 6.23969 0 9.6V18.4C0 21.7603 0 23.4405 0.653961 24.7239C1.2292 25.8529 2.14708 26.7708 3.27606 27.346C4.55953 28 6.23969 28 9.6 28H22.4C25.7603 28 27.4405 28 28.7239 27.346C29.8529 26.7708 30.7708 25.8529 31.346 24.7239C32 23.4405 32 21.7603 32 18.4V9.6C32 6.23969 32 4.55953 31.346 3.27606C30.7708 2.14708 29.8529 1.2292 28.7239 0.653961C27.4405 0 25.7603 0 22.4 0H9.6C6.23969 0 4.55953 0 3.27606 0.653961C2.14708 1.2292 1.2292 2.14708 0.653961 3.27606ZM1.99047 3.95704C1.5 4.91965 1.5 6.17976 1.5 8.7V19.3C1.5 21.8202 1.5 23.0804 1.99047 24.043C2.4219 24.8897 3.11031 25.5781 3.95704 26.0095C4.91965 26.5 6.17976 26.5 8.7 26.5H23.3C25.8202 26.5 27.0804 26.5 28.043 26.0095C28.8897 25.5781 29.5781 24.8897 30.0095 24.043C30.5 23.0804 30.5 21.8202 30.5 19.3V8.7C30.5 6.17976 30.5 4.91965 30.0095 3.95704C29.5781 3.11031 28.8897 2.4219 28.043 1.99047C27.0804 1.5 25.8202 1.5 23.3 1.5H8.7C6.17976 1.5 4.91965 1.5 3.95704 1.99047C3.11031 2.4219 2.4219 3.11031 1.99047 3.95704Z"
                    fill="currentColor"
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M9.6 1.5H11.5V26.5H9.6C7.89509 26.5 6.70662 26.4988 5.78136 26.4232C4.87361 26.3491 4.35208 26.2108 3.95704 26.0095C3.11031 25.5781 2.4219 24.8897 1.99047 24.043C1.78919 23.6479 1.65093 23.1264 1.57676 22.2186C1.50117 21.2934 1.5 20.1049 1.5 18.4V9.6C1.5 7.89509 1.50117 6.70662 1.57676 5.78136C1.65093 4.87361 1.78919 4.35208 1.99047 3.95704C2.4219 3.11031 3.11031 2.4219 3.95704 1.99047C4.35208 1.78919 4.87361 1.65093 5.78136 1.57676C6.70662 1.50117 7.89509 1.5 9.6 1.5ZM0 9.6C0 6.23969 0 4.55953 0.653961 3.27606C1.2292 2.14708 2.14708 1.2292 3.27606 0.653961C4.55953 0 6.23969 0 9.6 0H11.5H13V1.5V26.5V28H11.5H9.6C6.23969 28 4.55953 28 3.27606 27.346C2.14708 26.7708 1.2292 25.8529 0.653961 24.7239C0 23.4405 0 21.7603 0 18.4V9.6ZM5.5 6C4.94772 6 4.5 5.55228 4.5 5C4.5 4.44772 4.94772 4 5.5 4H8C8.55229 4 9 4.44772 9 5C9 5.55228 8.55229 6 8 6H5.5ZM5 10.5C4.44772 10.5 4 10.0523 4 9.5C4 8.94771 4.44772 8.5 5 8.5H8C8.55229 8.5 9 8.94771 9 9.5C9 10.0523 8.55229 10.5 8 10.5H5ZM4 14C4 14.5523 4.44772 15 5 15H8C8.55229 15 9 14.5523 9 14C9 13.4477 8.55229 13 8 13H5C4.44772 13 4 13.4477 4 14Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath id="clip0_56590_303425">
                    <rect width="32" height="28" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

const LeftTabIcon = styled(_LeftTabIcon)<{ $isActive: boolean }>`
    color: ${p => p.theme.iconTertiary};

    path:last-child {
        transition: fill 0.15s ease-in-out;
    }

    ${p =>
        p.$isActive &&
        css`
            path:last-child {
                fill: ${p.theme.iconSecondary};
            }
        `};
`;

const _RightTabIcon: FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="28"
            viewBox="0 0 32 28"
            fill="none"
            className={className}
        >
            <g clipPath="url(#clip0_56590_303410)">
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0.653961 3.27606C0 4.55953 0 6.23969 0 9.6V18.4C0 21.7603 0 23.4405 0.653961 24.7239C1.2292 25.8529 2.14708 26.7708 3.27606 27.346C4.55953 28 6.23969 28 9.6 28H22.4C25.7603 28 27.4405 28 28.7239 27.346C29.8529 26.7708 30.7708 25.8529 31.346 24.7239C32 23.4405 32 21.7603 32 18.4V9.6C32 6.23969 32 4.55953 31.346 3.27606C30.7708 2.14708 29.8529 1.2292 28.7239 0.653961C27.4405 0 25.7603 0 22.4 0H9.6C6.23969 0 4.55953 0 3.27606 0.653961C2.14708 1.2292 1.2292 2.14708 0.653961 3.27606ZM1.99047 3.95704C1.5 4.91965 1.5 6.17976 1.5 8.7V19.3C1.5 21.8202 1.5 23.0804 1.99047 24.043C2.4219 24.8897 3.11031 25.5781 3.95704 26.0095C4.91965 26.5 6.17976 26.5 8.7 26.5H23.3C25.8202 26.5 27.0804 26.5 28.043 26.0095C28.8897 25.5781 29.5781 24.8897 30.0095 24.043C30.5 23.0804 30.5 21.8202 30.5 19.3V8.7C30.5 6.17976 30.5 4.91965 30.0095 3.95704C29.5781 3.11031 28.8897 2.4219 28.043 1.99047C27.0804 1.5 25.8202 1.5 23.3 1.5H8.7C6.17976 1.5 4.91965 1.5 3.95704 1.99047C3.11031 2.4219 2.4219 3.11031 1.99047 3.95704Z"
                    fill="currentColor"
                />
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M20.5 1.5H22.4C24.1049 1.5 25.2934 1.50117 26.2186 1.57676C27.1264 1.65093 27.6479 1.78919 28.043 1.99047C28.8897 2.4219 29.5781 3.11031 30.0095 3.95704C30.2108 4.35208 30.3491 4.87361 30.4232 5.78136C30.4988 6.70662 30.5 7.89509 30.5 9.6V18.4C30.5 20.1049 30.4988 21.2934 30.4232 22.2186C30.3491 23.1264 30.2108 23.6479 30.0095 24.043C29.5781 24.8897 28.8897 25.5781 28.043 26.0095C27.6479 26.2108 27.1264 26.3491 26.2186 26.4232C25.2934 26.4988 24.1049 26.5 22.4 26.5H20.5V1.5ZM19 0H20.5H22.4C25.7603 0 27.4405 0 28.7239 0.653961C29.8529 1.2292 30.7708 2.14708 31.346 3.27606C32 4.55953 32 6.23969 32 9.6V18.4C32 21.7603 32 23.4405 31.346 24.7239C30.7708 25.8529 29.8529 26.7708 28.7239 27.346C27.4405 28 25.7603 28 22.4 28H20.5H19V26.5V1.5V0ZM24 6C23.4477 6 23 5.55228 23 5C23 4.44772 23.4477 4 24 4H26.5C27.0523 4 27.5 4.44772 27.5 5C27.5 5.55228 27.0523 6 26.5 6H24ZM24 10.5C23.4477 10.5 23 10.0523 23 9.5C23 8.94771 23.4477 8.5 24 8.5H27C27.5523 8.5 28 8.94771 28 9.5C28 10.0523 27.5523 10.5 27 10.5H24ZM23 14C23 14.5523 23.4477 15 24 15H27C27.5523 15 28 14.5523 28 14C28 13.4477 27.5523 13 27 13H24C23.4477 13 23 13.4477 23 14Z"
                    fill="currentColor"
                />
            </g>
            <defs>
                <clipPath id="clip0_56590_303410">
                    <rect width="32" height="28" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};

const RightTabIcon = styled(_RightTabIcon)<{ $isActive: boolean }>`
    color: ${p => p.theme.iconTertiary};

    path:last-child {
        transition: fill 0.15s ease-in-out;
    }

    ${p =>
        p.$isActive &&
        css`
            path:last-child {
                fill: ${p.theme.iconSecondary};
            }
        `};
`;
