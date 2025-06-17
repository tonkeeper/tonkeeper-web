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
import styled from 'styled-components';
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
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { CloseIcon, PinIconOutline, ReorderIcon16, UnpinIconOutline } from '../../Icon';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { useAppSdk } from '../../../hooks/appSdk';
import { useTranslation } from '../../../hooks/translation';

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
    const { close: closeWalletMenu, isOpen } = useMenuController('wallet-nav');

    const { isEditMode, setIsEditMode } = useContext(EditeModeContext);

    const onClickTab = (tab: BrowserTab) => {
        if (!isEditMode) {
            closeWalletMenu();
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

const BrowserTabsPinned: FC<{
    tabs: BrowserTab[];
    onUpdateOrder: (tabs: BrowserTab[]) => void;
}> = ({ tabs, onUpdateOrder }) => {
    const { t } = useTranslation();
    const { isEditMode, setIsEditMode, onClickTab } = useEditMode();
    const openedTabId = useOpenedTabId();
    const { mutate: changeBrowserTab } = useChangeBrowserTab();
    const sdk = useAppSdk();

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || !tabs) return;
        const updated = [...tabs];
        const [moved] = updated.splice(result.source.index, 1);
        updated.splice(result.destination.index, 0, moved);
        onUpdateOrder(updated);
    };

    if (!tabs) {
        return null;
    }

    const renderTabItem = (tab: BrowserTab, index: number) => (
        <Draggable key={tab.id} draggableId={tab.id} index={index}>
            {(provided, snapshotDrag) => {
                let transform = provided.draggableProps.style?.transform;

                if (snapshotDrag.isDragging && transform) {
                    transform = transform.replace(/\(.+\,/, '(0,');
                }

                const style: Record<string, unknown> = {
                    ...provided.draggableProps.style,
                    transform,
                    left: '8px'
                };

                return (
                    <AsideMenuItemStyled
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={style}
                        isSelected={tab.id === openedTabId}
                        onClick={() => onClickTab(tab)}
                    >
                        <LeftIconButton {...provided.dragHandleProps} $hidden={!isEditMode}>
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
                            <RightIconButton
                                onClick={() => changeBrowserTab({ ...tab, isPinned: false })}
                            >
                                <UnpinIconOutline />
                            </RightIconButton>
                        )}
                    </AsideMenuItemStyled>
                );
            }}
        </Draggable>
    );

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

            <DragDropContext
                onDragEnd={handleDragEnd}
                onDragStart={() => sdk.hapticNotification('impact_medium')}
            >
                <Droppable droppableId="browserTabs" direction="vertical">
                    {provided => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            {tabs?.map((tab, index) => renderTabItem(tab, index))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
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
            {tabs.map(tab => (
                <AsideMenuItemStyled
                    key={tab.id}
                    isSelected={tab.id === openedTabId}
                    onClick={() => onClickTab(tab)}
                >
                    <LeftIconButton
                        $hidden={!isEditMode}
                        onClick={() => changeBrowserTab({ ...tab, isPinned: true })}
                    >
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
