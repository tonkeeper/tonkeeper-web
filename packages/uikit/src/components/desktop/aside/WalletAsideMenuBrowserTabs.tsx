import {
    BrowserTab,
    useActiveBrowserTab,
    useBrowserTabs,
    useChangeBrowserTab,
    useCloseAllBrowserTabs,
    useCloseBrowserTab,
    useOpenBrowserTab,
    useReorderBrowserTabs
} from '../../../state/dapp-browser';
import { AsideMenuItem } from '../../shared/AsideItem';
import styled, { useTheme } from 'styled-components';
import { Label2 } from '../../Text';
import { useMenuController } from '../../../hooks/ionic';
import { Button, ButtonFlat } from '../../fields/Button';
import {
    createContext,
    Dispatch,
    FC,
    SetStateAction,
    useContext,
    useEffect,
    useState
} from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CloseIcon, PinIconOutline, ReorderIcon16, UnpinIconOutline } from '../../Icon';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';
import {
    AnalyticsEventDappClick,
    AnalyticsEventDappPin,
    AnalyticsEventDappUnpin
} from '@tonkeeper/core/dist/analytics';
import { useCountryContextTracker } from '../../../hooks/analytics/events-hooks';

const AsideMenuItemStyled = styled(AsideMenuItem)`
    background: ${p => (p.isSelected ? p.theme.backgroundContentTint : p.theme.backgroundPage)};
    padding-left: 10px;
    padding-right: 10px;
    gap: 0;
    height: 36px;
    will-change: transform;

    ${Label2} {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    > img {
        margin-right: 8px;
        flex-shrink: 0;
        height: 16px;
        width: 16px;
        border-radius: ${p => p.theme.corner2xSmall};
    }
`;

const HeadingWrapper = styled.div`
    display: flex;
`;

const Heading = styled(Label2)`
    color: ${p => p.theme.textSecondary};
    padding: 8px 0 4px 16px;
`;

const EditButton = styled(ButtonFlat)`
    margin-left: auto;
    padding: 8px 16px 4px;
`;

const LeftIconButton = styled(IconButtonTransparentBackground)<{ $hidden?: boolean }>`
    padding: 0 16px 0 8px;
    height: 36px;
    display: flex;
    align-items: center;
    flex-shrink: 0;

    ${p => p.$hidden && 'display: none;'}
`;

const RightIconButton = styled(IconButtonTransparentBackground)`
    padding: 0 8px 0 16px;
    margin-left: auto;
    height: 36px;
    display: flex;
    align-items: center;
    flex-shrink: 0;
`;

const GroupWrapper = styled.div`
    margin-top: 8px;
`;

const Divider = styled.div`
    width: calc(100% + 16px);
    margin: 0 -8px 8px;
    height: 1px;
    background: ${p => p.theme.separatorAlternate};
`;

const EditeModeContext = createContext<{
    isEditMode: boolean;
    setIsEditMode: Dispatch<SetStateAction<boolean>>;
}>({ isEditMode: false, setIsEditMode: () => {} });

const useEditMode = () => {
    const { mutate: openTab } = useOpenBrowserTab();
    const trackDappOpened = useCountryContextTracker();
    const { close: closeWalletMenu, isOpen } = useMenuController('wallet-nav');

    const { isEditMode, setIsEditMode } = useContext(EditeModeContext);

    const onClickTab = (tab: BrowserTab) => {
        if (!isEditMode) {
            closeWalletMenu();
            trackDappOpened(
                country =>
                    new AnalyticsEventDappClick({
                        location: country,
                        url: tab.url,
                        from: 'sidebar'
                    })
            );
            openTab(tab);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            setIsEditMode(false);
        }
    }, [isOpen]);

    return {
        isEditMode,
        setIsEditMode,
        onClickTab
    };
};

const useOpenedTabId = () => {
    const openedTab = useActiveBrowserTab();
    return typeof openedTab === 'object' ? openedTab?.id : undefined;
};

export const WalletAsideMenuBrowserTabs = () => {
    const { data: tabs } = useBrowserTabs();
    const { mutate: reorderBrowserTabs } = useReorderBrowserTabs();
    const [isEditMode, setIsEditMode] = useState(false);

    if (!tabs) {
        return null;
    }

    const pinnedTabs = tabs.filter(t => t.isPinned);
    const notPinnedTabs = tabs.filter(t => !t.isPinned);

    const onUpdatePinnedOrder = (newPinnedTabs: BrowserTab[]) => {
        reorderBrowserTabs([...newPinnedTabs, ...notPinnedTabs]);
    };

    return (
        <EditeModeContext.Provider value={{ isEditMode, setIsEditMode }}>
            {pinnedTabs.length > 0 && (
                <BrowserTabsPinned tabs={pinnedTabs} onUpdateOrder={onUpdatePinnedOrder} />
            )}
            {notPinnedTabs.length > 0 && <BrowserTabsNonPinned tabs={notPinnedTabs} />}
        </EditeModeContext.Provider>
    );
};

const SortableBrowserTab: FC<{
    tab: BrowserTab;
    isEditMode: boolean;
    openedTabId: string | undefined;
    onClickTab: (tab: BrowserTab) => void;
    unpinTab: (tab: BrowserTab) => void;
}> = ({ tab, isEditMode, openedTabId, onClickTab, unpinTab }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: tab.id
    });

    const style = {
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition,
        left: '8px'
    };

    return (
        <AsideMenuItemStyled
            ref={setNodeRef}
            style={style}
            isSelected={tab.id === openedTabId}
            onClick={() => onClickTab(tab)}
            {...attributes}
            {...(isEditMode ? listeners : {})}
        >
            <LeftIconButton $hidden={!isEditMode}>
                <ReorderIcon16 />
            </LeftIconButton>
            <img
                src={tab.iconUrl}
                onError={e => {
                    e.currentTarget.style.visibility = 'hidden';
                }}
            />
            <Label2>{tab.title}</Label2>
            {isEditMode && (
                <RightIconButton onClick={() => unpinTab(tab)}>
                    <UnpinIconOutline />
                </RightIconButton>
            )}
        </AsideMenuItemStyled>
    );
};

const BrowserTabsPinned: FC<{
    tabs: BrowserTab[];
    onUpdateOrder: (tabs: BrowserTab[]) => void;
}> = ({ tabs, onUpdateOrder }) => {
    const { t } = useTranslation();
    const { isEditMode, setIsEditMode, onClickTab } = useEditMode();
    const openedTabId = useOpenedTabId();
    const { mutate: changeBrowserTab } = useChangeBrowserTab();
    const sdk = useAppSdk();
    const track = useCountryContextTracker();
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || !tabs || active.id === over.id) return;
        const oldIndex = tabs.findIndex(t => t.id === active.id);
        const newIndex = tabs.findIndex(t => t.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;
        onUpdateOrder(arrayMove([...tabs], oldIndex, newIndex));
    };

    const unpinTab = (tab: BrowserTab) => {
        changeBrowserTab({ ...tab, isPinned: false });
        track(country => new AnalyticsEventDappUnpin({ url: tab.url, location: country }));
    };

    if (!tabs) {
        return null;
    }

    return (
        <GroupWrapper>
            <Divider />
            <HeadingWrapper>
                <Heading>{t('wallet_aside_menu_tabs_pinned')}</Heading>
                <EditButton onClick={() => setIsEditMode(m => !m)}>
                    {isEditMode
                        ? t('wallet_aside_menu_tabs_edit_btn_done')
                        : t('wallet_aside_menu_tabs_edit_btn_edit')}
                </EditButton>
            </HeadingWrapper>

            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
                onDragStart={() => sdk.hapticNotification('impact_medium')}
                modifiers={[restrictToVerticalAxis]}
            >
                <SortableContext items={tabs.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tabs.map(tab => (
                        <SortableBrowserTab
                            key={tab.id}
                            tab={tab}
                            isEditMode={isEditMode}
                            openedTabId={openedTabId}
                            onClickTab={onClickTab}
                            unpinTab={unpinTab}
                        />
                    ))}
                </SortableContext>
            </DndContext>
        </GroupWrapper>
    );
};

const CloseAllButtonWrapper = styled.div`
    width: 100%;
    padding: 8px 4px 0;

    > button {
        height: 32px;
    }
`;

const BrowserTabsNonPinned: FC<{ tabs: BrowserTab[] }> = ({ tabs }) => {
    const { t } = useTranslation();
    const { isEditMode, setIsEditMode, onClickTab } = useEditMode();
    const openedTabId = useOpenedTabId();
    const { mutate: changeBrowserTab } = useChangeBrowserTab();
    const { mutate: closeTab } = useCloseBrowserTab();
    const { mutate: closeAllTabs } = useCloseAllBrowserTabs();
    const { close: closeMenu } = useMenuController('wallet-nav');
    const track = useCountryContextTracker();
    const { mutate: openBlancTab } = useOpenBrowserTab();
    const onClickOpenNewTab = () => {
        closeMenu();
        openBlancTab('blanc');
    };

    const pinTab = (tab: BrowserTab) => {
        changeBrowserTab({ ...tab, isPinned: true });
        track(country => new AnalyticsEventDappPin({ url: tab.url, location: country }));
    };

    if (!tabs) {
        return null;
    }

    return (
        <GroupWrapper>
            <Divider />
            <HeadingWrapper>
                <Heading>{t('wallet_aside_menu_tabs_active')}</Heading>
                <EditButton onClick={() => setIsEditMode(m => !m)}>
                    {isEditMode
                        ? t('wallet_aside_menu_tabs_edit_btn_done')
                        : t('wallet_aside_menu_tabs_edit_btn_edit')}
                </EditButton>
            </HeadingWrapper>
            {!isEditMode && (
                <AsideMenuItemStyled isSelected={false} onClick={onClickOpenNewTab}>
                    <PlusImage />
                    <Label2>{t('browser_new_tab')}</Label2>
                </AsideMenuItemStyled>
            )}
            {tabs.map(tab => (
                <AsideMenuItemStyled
                    key={tab.id}
                    isSelected={tab.id === openedTabId}
                    onClick={() => onClickTab(tab)}
                >
                    <LeftIconButton $hidden={!isEditMode} onClick={() => pinTab(tab)}>
                        <PinIconOutline />
                    </LeftIconButton>
                    <img
                        src={tab.iconUrl}
                        onError={e => {
                            e.currentTarget.style.visibility = 'hidden';
                        }}
                    />
                    <Label2>{tab.title}</Label2>
                    {isEditMode && (
                        <RightIconButton
                            onClick={e => {
                                closeTab(tab);
                                e.stopPropagation();
                            }}
                        >
                            <CloseIcon />
                        </RightIconButton>
                    )}
                </AsideMenuItemStyled>
            ))}
            {tabs.length > 2 && (
                <CloseAllButtonWrapper>
                    <Button
                        secondary
                        fullWidth
                        onClick={() => {
                            closeAllTabs();
                            closeMenu();
                        }}
                    >
                        {t('wallet_aside_menu_tabs_close_all_btn')}
                    </Button>
                </CloseAllButtonWrapper>
            )}
        </GroupWrapper>
    );
};

const PlusImage = () => {
    const theme = useTheme();

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            style={{ marginRight: '8px' }}
        >
            <rect width="16" height="16" rx="5" fill={theme.backgroundContent} />
            <path
                d="M8 8H12.25M8 8H3.75M8 8V3.75M8 8V12.25"
                stroke={theme.iconSecondary}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};
