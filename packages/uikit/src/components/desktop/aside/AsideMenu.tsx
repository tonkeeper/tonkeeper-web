import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { FC, forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useLocation, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useAppContext } from '../../../hooks/appContext';
import { useAsideActiveRoute } from '../../../hooks/desktop/useAsideActiveRoute';
import { useTranslation } from '../../../hooks/translation';
import { useIsScrolled } from '../../../hooks/useIsScrolled';
import { scrollToTop } from '../../../libs/common';
import { AppProRoute, AppRoute } from '../../../libs/routes';
import { useMutateUserUIPreferences, useUserUIPreferences } from '../../../state/theme';
import { useMutateActiveTonWallet } from '../../../state/wallet';
import { fallbackRenderOver } from '../../Error';
import { GlobeIcon, PlusIcon, SlidersIcon, StatsIcon } from '../../Icon';
import { ScrollContainer } from '../../ScrollContainer';
import { Label2 } from '../../Text';
import { AsideMenuItem } from '../../shared/AsideItem';
import { AsideHeader } from './AsideHeader';
import { SubscriptionInfoBlock } from './SubscriptionInfoBlock';
import { useAddWalletNotification } from '../../modals/AddWalletNotificationControlled';
import {
    DragDropContext,
    Draggable,
    DraggableProvidedDraggableProps,
    Droppable
} from 'react-beautiful-dnd';
import { AsideMenuAccount } from './AsideMenuAccount';
import { AsideMenuFolder } from './AsideMenuFolder';

import { AccountsFolder, useAccountsDNDDrop, useSideBarItems } from '../../../state/folders';

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

const DraggingBlock = styled.div<{ $isDragging: boolean }>`
    cursor: pointer !important;
    border-radius: ${p => p.theme.corner2xSmall};
    overflow: hidden;
    transition: background-color 0.15s ease-in-out;
    ${p =>
        p.$isDragging &&
        css`
            pointer-events: auto !important;
            cursor: grabbing !important;
            background-color: ${p.theme.backgroundContentTint};

            * {
                pointer-events: none;
            }

            div {
                background-color: ${p.theme.backgroundContentTint};
            }
        `}
`;

export const AsideMenuDNDItem = forwardRef<
    HTMLDivElement,
    {
        item: Account | AccountsFolder;
        mightBeHighlighted: boolean;
        isDragging: boolean;
    } & DraggableProvidedDraggableProps
>(({ item, mightBeHighlighted, isDragging, ...rest }, fRef) => {
    const { mutateAsync: setActiveWallet } = useMutateActiveTonWallet();
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavigateHome = useCallback(() => {
        const navigateHomeFromRoutes = [AppProRoute.dashboard, AppRoute.settings, AppRoute.browser];
        if (navigateHomeFromRoutes.some(path => location.pathname.startsWith(path))) {
            return navigate(AppRoute.home);
        } else {
            scrollToTop();
        }
    }, [location.pathname]);

    const onClickWallet = useCallback(
        (walletId: WalletId) => setActiveWallet(walletId).then(handleNavigateHome),
        [setActiveWallet, handleNavigateHome]
    );

    if (!item) {
        return null;
    }

    return (
        <DraggingBlock ref={fRef} $isDragging={isDragging} {...rest}>
            {item.type === 'folder' ? (
                <AsideMenuFolder
                    folder={item}
                    onClickWallet={onClickWallet}
                    accountMightBeHighlighted={mightBeHighlighted}
                />
            ) : (
                <AsideMenuAccount
                    account={item}
                    mightBeHighlighted={mightBeHighlighted}
                    onClickWallet={onClickWallet}
                />
            )}
        </DraggingBlock>
    );
});

const AccountDNDBlock: FC<{
    items: (Account | AccountsFolder)[];
    activeRoute: string | undefined;
}> = ({ activeRoute, items }) => {
    const { handleDrop, itemsOptimistic } = useAccountsDNDDrop(items);

    return (
        <DragDropContext onDragEnd={handleDrop}>
            <Droppable direction="vertical" droppableId="droppable-1">
                {provided => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                        {itemsOptimistic.map((account, index) => (
                            <Draggable key={account.id} draggableId={account.id} index={index}>
                                {(p, snapshot) => {
                                    const transform = p.draggableProps.style?.transform;
                                    if (transform) {
                                        try {
                                            const t = transform.split(',')[1];
                                            p.draggableProps.style!.transform =
                                                'translate(0px,' + t;
                                        } catch (_) {
                                            //
                                        }
                                    }
                                    return (
                                        <AsideMenuDNDItem
                                            ref={p.innerRef}
                                            item={account}
                                            mightBeHighlighted={!activeRoute}
                                            isDragging={snapshot.isDragging}
                                            {...p.draggableProps}
                                            {...p.dragHandleProps}
                                        />
                                    );
                                }}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
};

const AsideMenuPayload: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const { onOpen: addWallet } = useAddWalletNotification();
    const { proFeatures } = useAppContext();
    const items = useSideBarItems();
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
                    <AsideMenuItem
                        onClick={() => handleNavigateClick(AppRoute.browser)}
                        isSelected={activeRoute === AppRoute.browser}
                    >
                        <IconWrapper>
                            <GlobeIcon />
                        </IconWrapper>
                        <Label2>{t('aside_discover')}</Label2>
                    </AsideMenuItem>
                    <AccountDNDBlock items={items} activeRoute={activeRoute} />
                </ScrollContainer>
                <AsideMenuBottom>
                    <DividerStyled isHidden={!closeBottom} />
                    <AsideMenuItem isSelected={false} onClick={() => addWallet()}>
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
