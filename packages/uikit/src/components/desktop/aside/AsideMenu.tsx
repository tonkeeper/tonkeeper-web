import { Account } from '@tonkeeper/core/dist/entries/account';
import {
    WalletId,
    sortDerivationsByIndex,
    sortWalletsByVersion
} from '@tonkeeper/core/dist/entries/wallet';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { FC, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppContext } from '../../../hooks/appContext';
import { useAsideActiveRoute } from '../../../hooks/desktop/useAsideActiveRoute';
import { useTranslation } from '../../../hooks/translation';
import { useIsHovered } from '../../../hooks/useIsHovered';
import { useIsScrolled } from '../../../hooks/useIsScrolled';
import { scrollToTop } from '../../../libs/common';
import { AppProRoute, AppRoute } from '../../../libs/routes';
import { useMutateUserUIPreferences, useUserUIPreferences } from '../../../state/theme';
import {
    useAccountsState,
    useActiveAccount,
    useActiveTonNetwork,
    useMutateActiveTonWallet
} from '../../../state/wallet';
import { fallbackRenderOver } from '../../Error';
import { GearIconEmpty, GlobeIcon, PlusIcon, SlidersIcon, StatsIcon } from '../../Icon';
import { ScrollContainer } from '../../ScrollContainer';
import { Label2 } from '../../Text';
import { AccountBadge, WalletIndexBadge, WalletVersionBadge } from '../../account/AccountBadge';
import { ImportNotification } from '../../create/ImportNotification';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { useLedgerIndexesSettingsNotification } from '../../modals/LedgerIndexesSettingsNotification';
import { useWalletVersionSettingsNotification } from '../../modals/WalletVersionSettingsNotification';
import { AsideMenuItem } from '../../shared/AsideItem';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { AsideHeader } from './AsideHeader';
import { SubscriptionInfoBlock } from './SubscriptionInfoBlock';

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

const AsideMenuSubItem = styled(AsideMenuItem)`
    padding-left: 36px;
`;

const AccountBadgeStyled = styled(AccountBadge)`
    margin-left: -4px;
`;

const WalletVersionBadgeStyled = styled(WalletVersionBadge)`
    margin-left: -4px;
`;

const WalletIndexBadgeStyled = styled(WalletIndexBadge)`
    margin-left: -4px;
`;

const GearIconButtonStyled = styled(IconButtonTransparentBackground)<{ isShown: boolean }>`
    margin-left: auto;
    margin-right: -10px;
    flex-shrink: 0;
    padding-left: 0;

    opacity: ${p => (p.isShown ? 1 : 0)};
    transition: opacity 0.15s ease-in-out;
`;

export const AsideMenuAccount: FC<{ account: Account; isSelected: boolean }> = ({
    account,
    isSelected
}) => {
    const { onOpen: openWalletVersionSettings } = useWalletVersionSettingsNotification();
    const { onOpen: openLedgerIndexesSettings } = useLedgerIndexesSettingsNotification();
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

    const { isHovered, ref } = useIsHovered<HTMLButtonElement>();

    const onClickWallet = (walletId: WalletId) =>
        setActiveWallet(walletId).then(handleNavigateHome);

    if (!account) {
        return null;
    }

    if (account.type === 'mnemonic') {
        const sortedWallets = account.tonWallets.slice().sort(sortWalletsByVersion);
        return (
            <>
                <AsideMenuItem
                    isSelected={isSelected && sortedWallets.length === 1}
                    onClick={() => onClickWallet(sortedWallets[0].id)}
                    ref={ref}
                >
                    {shouldShowIcon && (
                        <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                    )}
                    <Label2>{account.name}</Label2>
                    <GearIconButtonStyled
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            openWalletVersionSettings({ accountId: account.id });
                        }}
                        isShown={isHovered}
                    >
                        <GearIconEmpty />
                    </GearIconButtonStyled>
                </AsideMenuItem>
                {sortedWallets.length > 1 &&
                    sortedWallets.map(wallet => (
                        <AsideMenuSubItem
                            key={wallet.id}
                            isSelected={isSelected && account.activeTonWallet.id === wallet.id}
                            onClick={() => onClickWallet(wallet.id)}
                        >
                            <Label2>
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
                            </Label2>
                            <WalletVersionBadgeStyled size="s" walletVersion={wallet.version} />
                        </AsideMenuSubItem>
                    ))}
            </>
        );
    }

    if (account.type === 'ledger') {
        const sortedDerivations = account.derivations.slice().sort(sortDerivationsByIndex);
        return (
            <>
                <AsideMenuItem
                    isSelected={isSelected && sortedDerivations.length === 1}
                    onClick={() => onClickWallet(sortedDerivations[0].activeTonWalletId)}
                    ref={ref}
                >
                    {shouldShowIcon && (
                        <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                    )}
                    <Label2>{account.name}</Label2>
                    <AccountBadgeStyled accountType={account.type} size="s" />

                    {/*show settings only for non-legacy added ledger accounts*/}
                    {account.allAvailableDerivations.length > 1 && (
                        <GearIconButtonStyled
                            onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                openLedgerIndexesSettings({ accountId: account.id });
                            }}
                            isShown={isHovered}
                        >
                            <GearIconEmpty />
                        </GearIconButtonStyled>
                    )}
                </AsideMenuItem>
                {sortedDerivations.length > 1 &&
                    sortedDerivations.map(derivation => {
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
                                <WalletIndexBadgeStyled size="s">
                                    {'#' + (derivation.index + 1)}
                                </WalletIndexBadgeStyled>
                            </AsideMenuSubItem>
                        );
                    })}
            </>
        );
    }

    if (account.type === 'ton-only') {
        const sortedWallets = account.tonWallets.slice().sort(sortWalletsByVersion);
        return (
            <>
                <AsideMenuItem
                    isSelected={isSelected && sortedWallets.length === 1}
                    onClick={() => onClickWallet(account.activeTonWallet.id)}
                    ref={ref}
                >
                    {shouldShowIcon && (
                        <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                    )}
                    <Label2>{account.name}</Label2>
                    <AccountBadgeStyled accountType={account.type} size="s" />
                    <GearIconButtonStyled
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            openWalletVersionSettings({ accountId: account.id });
                        }}
                        isShown={isHovered}
                    >
                        <GearIconEmpty />
                    </GearIconButtonStyled>
                </AsideMenuItem>
                {sortedWallets.length > 1 &&
                    sortedWallets.map(wallet => (
                        <AsideMenuSubItem
                            key={wallet.id}
                            isSelected={isSelected && account.activeTonWallet.id === wallet.id}
                            onClick={() => onClickWallet(wallet.id)}
                        >
                            <Label2>
                                {toShortValue(formatAddress(wallet.rawAddress, network))}
                            </Label2>
                            <WalletVersionBadgeStyled size="s" walletVersion={wallet.version} />
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
                ref={ref}
            >
                {shouldShowIcon && (
                    <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                )}
                <Label2>{account.name}</Label2>
                <AccountBadgeStyled accountType={account.type} size="s" />
            </AsideMenuItem>
        );
    }

    if (account.type === 'watch-only') {
        return (
            <AsideMenuItem
                isSelected={isSelected}
                onClick={() => onClickWallet(account.activeTonWallet.id)}
                ref={ref}
            >
                {shouldShowIcon && (
                    <WalletEmoji emojiSize="16px" containerSize="16px" emoji={account.emoji} />
                )}
                <Label2>{account.name}</Label2>
                <AccountBadgeStyled accountType={account.type} size="s" />
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
                        <SubscriptionInfoBlock />
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
