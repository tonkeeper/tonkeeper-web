import { FC, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppContext } from '../../../hooks/appContext';
import { useTranslation } from '../../../hooks/translation';
import { scrollToTop } from '../../../libs/common';
import { AppProRoute, AppRoute } from '../../../libs/routes';
import { useMutateActiveWallet } from '../../../state/account';
import { useWalletState } from '../../../state/wallet';
import { PlusIcon, SlidersIcon, StatsIcon } from '../../Icon';
import { Label2 } from '../../Text';
import { ImportNotification } from '../../create/ImportNotification';
import { SubscriptionInfo } from './SubscriptionInfo';
import { WalletEmoji } from '../../shared/emoji/WalletEmoji';
import { useIsScrolled } from '../../../hooks/useIsScrolled';
import { useUserUIPreferences, useMutateUserUIPreferences } from '../../../state/theme';
import { AsideMenuItem } from '../../shared/AsideItem';
import { AsideHeader } from './AsideHeader';

const AsideContainer = styled.div<{ width: number }>`
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    width: ${p => p.width}px;
    border-right: 1px solid ${p => p.theme.backgroundContentAttention};
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

    & > ${AsideMenuItem}:nth-child(2) {
        margin-top: 0.5rem;
    }
`;

export const AsideMenuAccount: FC<{ publicKey: string; isSelected: boolean }> = ({
    publicKey,
    isSelected
}) => {
    const { t } = useTranslation();
    const { data: wallet } = useWalletState(publicKey);
    const { mutate } = useMutateActiveWallet();
    const navigate = useNavigate();

    const { account } = useAppContext();
    const shouldShowIcon = account.publicKeys.length > 1;

    const handleNavigateHome = useCallback(() => {
        if (location.pathname !== AppRoute.home) {
            return navigate(AppRoute.home);
        } else {
            scrollToTop();
        }
    }, [location.pathname]);

    const onClick = useCallback(() => {
        mutate(publicKey);
        handleNavigateHome();
    }, [publicKey, mutate, handleNavigateHome]);

    if (!wallet) {
        return null;
    }

    const name = wallet.name ? wallet.name : t('wallet_title');

    return (
        <AsideMenuItem isSelected={isSelected} onClick={onClick}>
            {shouldShowIcon && (
                <WalletEmoji emojiSize="16px" containerSize="16px" emoji={wallet.emoji} />
            )}
            <Label2>{name}</Label2>
        </AsideMenuItem>
    );
};

export const AsideMenu: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const [isOpenImport, setIsOpenImport] = useState(false);
    const { account, proFeatures } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const { ref, closeBottom } = useIsScrolled();

    const activeRoute = useMemo<string | undefined>(() => {
        if (location.pathname.startsWith(AppProRoute.dashboard)) {
            return AppProRoute.dashboard;
        }

        if (location.pathname.startsWith(AppRoute.settings)) {
            return AppRoute.settings;
        }

        return undefined;
    }, [location.pathname]);

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
                    {account.publicKeys.map(publicKey => (
                        <AsideMenuAccount
                            key={publicKey}
                            publicKey={publicKey}
                            isSelected={
                                !activeRoute &&
                                !!account.activePublicKey &&
                                account.activePublicKey === publicKey
                            }
                        />
                    ))}
                </ScrollContainer>
                <AsideMenuBottom>
                    <DividerStyled isHidden={!closeBottom} />
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
                    <SubscriptionInfo />
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
