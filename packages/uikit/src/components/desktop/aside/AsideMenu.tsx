import { FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppContext } from '../../../hooks/appContext';
import { useAsideActiveRoute } from '../../../hooks/desktop/useAsideActiveRoute';
import { useTranslation } from '../../../hooks/translation';
import { useIsScrolled } from '../../../hooks/useIsScrolled';
import { scrollToTop } from '../../../libs/common';
import { AppProRoute, AppRoute } from '../../../libs/routes';
import { useMutateUserUIPreferences, useUserUIPreferences } from '../../../state/theme';
import {
    useAccountsState,
    useActiveTonNetwork,
    useMutateActiveTonWallet,
    useActiveAccount
} from '../../../state/wallet';
import { fallbackRenderOver } from '../../Error';
import { GearIconEmpty, GlobeIcon, PlusIcon, SlidersIcon, StatsIcon } from '../../Icon';
import { Label2 } from '../../Text';
import { ImportNotification } from '../../create/ImportNotification';
import { AsideMenuItem } from '../../shared/AsideItem';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { AsideHeader } from './AsideHeader';
import { SubscriptionInfo } from './SubscriptionInfo';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { WalletId, walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { useWalletVersionSettingsNotification } from '../../modals/WalletVersionSettingsNotification';

const AsideContainer = styled.div<{ width: number }>`
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    width: ${p => p.width}px;
    border-right: 1px solid ${p => p.theme.backgroundContentAttention};

    * {
        user-select: none;
    }
`;

const AsideResizeHandle = styled.div`
    position: absolute;
    height: 100%;
    width: 10px;
    cursor: col-resize;
    right: -5px;
    z-index: 50;
`;

const AsideContentContainer = styled.div`
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    height: calc(100% - 69px);

    background: ${p => p.theme.backgroundContent};
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.5rem 0;
`;

const ScrollContainer = styled.div`
    overflow: auto;
`;

const DividerStyled = styled.div<{ isHidden?: boolean }>`
    opacity: ${p => (p.isHidden ? 0 : 1)};
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
    margin: 0 -0.5rem;
    width: calc(100% + 1rem);

    transition: opacity 0.15s ease-in-out;
`;

const IconWrapper = styled.div`
    color: ${p => p.theme.iconSecondary};
    height: fit-content;

    > svg {
        display: block;
    }
`;

const AsideMenuBottom = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;

    background: ${p => p.theme.backgroundContent};
    padding-bottom: 0.5rem;
`;

const SubscriptionInfoStyled = styled(SubscriptionInfo)`
    margin-top: 0.5rem;
    padding: 6px 16px 6px 8px;
`;

const AsideMenuSubItem = styled(AsideMenuItem)`
    padding-left: 36px;
`;

const Badge = styled.div`
    padding: 2px 4px;
    margin-left: -4px;
    background: ${p => p.theme.backgroundContentAttention};
    border-radius: 3px;
    color: ${p => p.theme.textSecondary};
    font-size: 9px;
    font-style: normal;
    font-weight: 510;
    line-height: 12px;
`;

const GearIconButtonStyled = styled(IconButtonTransparentBackground)`
    margin-left: auto;
    margin-right: -10px;
`;

const AccountBadge: FC<{ account: Account }> = ({ account }) => {
    if (account.type === 'ledger') {
        return <Badge>LEDGER</Badge>;
    }

    if (account.type === 'ton-only') {
        return <Badge>SIGNER</Badge>;
    }

    if (account.type === 'keystone') {
        return <Badge>KEYSTONE</Badge>;
    }

    return null;
};

export const AsideMenuAccount: FC<{ account: Account; isSelected: boolean }> = ({
    account,
    isSelected
}) => {
    const { onOpen: openWalletVersionSettings } = useWalletVersionSettingsNotification();
    const network = useActiveTonNetwork();
    const { mutateAsync: setActiveWallet } = useMutateActiveTonWallet();
    const navigate = useNavigate();
    const location = useLocation();

    const accounts = useAccountsState();
    const shouldShowIcon = accounts.length > 1;

    const handleNavigateHome = useCallback(() => {
        const navigateHomeFromRoutes = [AppProRoute.dashboard, AppRoute.settings, AppRoute.browser];
        if (navigateHomeFromRoutes.some(path => location.pathname.startsWith(path))) {
            return navigate(AppRoute.home);
        } else {
            scrollToTop();
        }
    }, [location.pathname]);

    const onClickWallet = (walletId: WalletId) =>
        setActiveWallet(walletId).then(handleNavigateHome);

    if (!account) {
        return null;
    }

    if (account.allTonWallets.length === 1) {
        return (
            <AsideMenuItem
                isSelected={isSelected}
                onClick={() => onClickWallet(account.activeTonWallet.id)}
            >
                {shouldShowIcon && (
                    <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                )}
                <Label2>{account.name}</Label2>
                <AccountBadge account={account} />
            </AsideMenuItem>
        );
    }

    if (account.type === 'mnemonic') {
        return (
            <>
                <AsideMenuItem
                    isSelected={false}
                    onClick={() => onClickWallet(account.activeTonWallet.id)}
                >
                    {shouldShowIcon && (
                        <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                    )}
                    <Label2>{account.name}</Label2>
                    <GearIconButtonStyled onClick={openWalletVersionSettings}>
                        <GearIconEmpty />
                    </GearIconButtonStyled>
                </AsideMenuItem>
                {account.tonWallets.map(wallet => (
                    <AsideMenuSubItem
                        key={wallet.id}
                        isSelected={isSelected && account.activeTonWallet.id === wallet.id}
                        onClick={() => onClickWallet(wallet.id)}
                    >
                        <Label2>{toShortValue(formatAddress(wallet.rawAddress, network))}</Label2>
                        <Badge>{walletVersionText(wallet.version)}</Badge>
                    </AsideMenuSubItem>
                ))}
            </>
        );
    }

    if (account.type === 'ledger') {
        return (
            <>
                <AsideMenuItem
                    isSelected={false}
                    onClick={() => onClickWallet(account.activeTonWallet.id)}
                >
                    {shouldShowIcon && (
                        <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                    )}
                    <Label2>{account.name}</Label2>
                    <AccountBadge account={account} />
                </AsideMenuItem>
                {account.derivations.map(derivation => {
                    const wallet = derivation.tonWallets.find(
                        w => w.id === derivation.activeTonWalletId
                    )!;

                    return (
                        <AsideMenuSubItem
                            key={derivation.index}
                            isSelected={
                                isSelected && account.activeDerivationIndex === derivation.index
                            }
                            onClick={() => onClickWallet(derivation.activeTonWalletId)}
                        >
                            <Label2>
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
                            </Label2>
                            <Badge>{'#' + derivation.index}</Badge>
                        </AsideMenuSubItem>
                    );
                })}
            </>
        );
    }

    if (account.type === 'ton-only') {
        return (
            <>
                <AsideMenuItem
                    isSelected={false}
                    onClick={() => onClickWallet(account.activeTonWallet.id)}
                >
                    {shouldShowIcon && (
                        <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                    )}
                    <Label2>{account.name}</Label2>
                    <AccountBadge account={account} />
                </AsideMenuItem>
                {account.tonWallets.map(wallet => (
                    <AsideMenuSubItem
                        key={wallet.id}
                        isSelected={isSelected && account.activeTonWallet.id === wallet.id}
                        onClick={() => onClickWallet(wallet.id)}
                    >
                        <Label2>{toShortValue(formatAddress(wallet.rawAddress, network))}</Label2>
                    </AsideMenuSubItem>
                ))}
            </>
        );
    }

    if (account.type === 'keystone') {
        return (
            <AsideMenuItem
                isSelected={isSelected}
                onClick={() => onClickWallet(account.activeTonWallet.id)}
            >
                {shouldShowIcon && (
                    <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                )}
                <Label2>{account.name}</Label2>
                <AccountBadge account={account} />
            </AsideMenuItem>
        );
    }

    assertUnreachable(account);
};

const AsideMenuPayload: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const [isOpenImport, setIsOpenImport] = useState(false);
    const { proFeatures } = useAppContext();
    const accounts = useAccountsState();
    const activeAccount = useActiveAccount();
    const navigate = useNavigate();
    const location = useLocation();
    const { ref, closeBottom } = useIsScrolled();

    const activeRoute = useAsideActiveRoute();

    const handleNavigateClick = useCallback(
        (route: string) => {
            if (location.pathname !== route) {
                return navigate(route);
            } else {
                scrollToTop();
            }
        },
        [location.pathname]
    );

    const [asideWidth, setAsideWidth] = useState(250);
    const asideWidthRef = useRef(asideWidth);
    const isResizing = useRef(false);
    const { data: uiPreferences } = useUserUIPreferences();
    const { mutate: mutateWidth } = useMutateUserUIPreferences();

    useLayoutEffect(() => {
        if (uiPreferences?.asideWidth) {
            setAsideWidth(uiPreferences?.asideWidth);
            asideWidthRef.current = uiPreferences?.asideWidth;
        }
    }, [uiPreferences?.asideWidth]);

    useEffect(() => {
        const minWidth = 200;
        const maxWidth = 500;
        const onMouseUp = () => {
            document.body.style.cursor = 'unset';
            document.documentElement.classList.remove('no-user-select');
            isResizing.current = false;
            mutateWidth({ asideWidth: asideWidthRef.current });
        };

        const onMouseMove = (e: MouseEvent) => {
            if (isResizing.current) {
                const newWidth =
                    e.pageX < minWidth ? minWidth : e.pageX > maxWidth ? maxWidth : e.pageX;
                setAsideWidth(newWidth);
                asideWidthRef.current = newWidth;
            }
        };

        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);
        return () => {
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mousemove', onMouseMove);
        };
    }, [mutateWidth]);

    return (
        <AsideContainer width={asideWidth}>
            <AsideHeader width={asideWidth} />
            <AsideContentContainer className={className}>
                <ScrollContainer ref={ref}>
                    {proFeatures && (
                        <AsideMenuItem
                            isSelected={activeRoute === AppProRoute.dashboard}
                            onClick={() => handleNavigateClick(AppProRoute.dashboard)}
                        >
                            <StatsIcon />
                            <Label2>{t('aside_dashboard')}</Label2>
                        </AsideMenuItem>
                    )}
                    {accounts.map(account => (
                        <AsideMenuAccount
                            key={account.id}
                            account={account}
                            isSelected={!activeRoute && activeAccount.id === account.id}
                        />
                    ))}
                </ScrollContainer>
                <AsideMenuBottom>
                    <DividerStyled isHidden={!closeBottom} />
                    <AsideMenuItem
                        onClick={() => handleNavigateClick(AppRoute.browser)}
                        isSelected={activeRoute === AppRoute.browser}
                    >
                        <IconWrapper>
                            <GlobeIcon />
                        </IconWrapper>
                        <Label2>{t('aside_discover')}</Label2>
                    </AsideMenuItem>
                    <AsideMenuItem isSelected={false} onClick={() => setIsOpenImport(true)}>
                        <IconWrapper>
                            <PlusIcon />
                        </IconWrapper>
                        <Label2>{t('aside_add_wallet')}</Label2>
                    </AsideMenuItem>
                    <AsideMenuItem
                        onClick={() => handleNavigateClick(AppRoute.settings)}
                        isSelected={activeRoute === AppRoute.settings}
                    >
                        <IconWrapper>
                            <SlidersIcon />
                        </IconWrapper>
                        <Label2>{t('aside_settings')}</Label2>
                    </AsideMenuItem>
                    <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to load Pro State')}>
                        <SubscriptionInfoStyled />
                    </ErrorBoundary>
                </AsideMenuBottom>
                <ImportNotification isOpen={isOpenImport} setOpen={setIsOpenImport} />
            </AsideContentContainer>
            <AsideResizeHandle
                onMouseDown={() => {
                    isResizing.current = true;
                    document.body.style.cursor = 'col-resize';
                    document.documentElement.classList.add('no-user-select');
                }}
            />
        </AsideContainer>
    );
};

export const AsideMenu: FC<{ className?: string }> = ({ className }) => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to load aside menu')}>
            <AsideMenuPayload className={className} />
        </ErrorBoundary>
    );
};
