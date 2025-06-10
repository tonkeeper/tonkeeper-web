import {
    BrowserTab,
    useActiveBrowserTab,
    useBrowserTabs,
    useCloseBrowserTab,
    useOpenBrowserTab,
    useReorderBrowserTabs
} from '../../../state/dapp-browser';
import { AsideMenuItem } from '../../shared/AsideItem';
import styled from 'styled-components';
import { Label2 } from '../../Text';
import { useMenuController } from '../../../hooks/ionic';
import { ButtonFlat } from '../../fields/Button';
import { FC, useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { CloseIcon, ReorderIcon } from '../../Icon';
import { IconButtonTransparentBackground } from '../../fields/IconButton';

const AsideMenuItemStyled = styled(AsideMenuItem)`
    background: ${p => (p.isSelected ? p.theme.backgroundContentTint : p.theme.backgroundPage)};
    height: unset;
    padding-left: 16px;
    padding-right: 16px;
    gap: 0;

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

const ReorderHandle = styled.div<{ $hidden?: boolean }>`
    padding: 2px 8px 2px 8px;
    margin: -8px 0 -8px -16px;
    flex-shrink: 0;
    display: flex;

    color: ${p => p.theme.iconSecondary};

    ${p => p.$hidden && 'display: none;'}
`;

const Wrapper = styled.div``;

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

const CloseButton = styled(IconButtonTransparentBackground)`
    padding: 8px 8px 8px 8px;
    margin: -8px -16px -8px auto;
    flex-shrink: 0;
`;

export const WalletAsideMenuBrowserTabs: FC<{ className?: string }> = ({ className }) => {
    const { data: tabs } = useBrowserTabs();
    const { mutate: reorderBrowserTabs } = useReorderBrowserTabs();
    const openedTab = useActiveBrowserTab();
    const openedTabId = typeof openedTab === 'object' ? openedTab?.id : undefined;
    const { mutate: openTab } = useOpenBrowserTab();
    const { close: closeWalletMenu } = useMenuController('wallet-nav');

    const [isEditMode, setIsEditMode] = useState(false);

    const onClick = (tab: BrowserTab) => {
        if (!isEditMode) {
            closeWalletMenu();
            openTab(tab);
        }
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || !tabs) return;
        const updated = [...tabs];
        const [moved] = updated.splice(result.source.index, 1);
        updated.splice(result.destination.index, 0, moved);
        reorderBrowserTabs(updated);
    };

    const { mutate: closeTab } = useCloseBrowserTab();
    const { isOpen } = useMenuController('wallet-nav');

    useEffect(() => {
        if (!isOpen) {
            setIsEditMode(false);
        }
    }, [isOpen]);

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

                const style = {
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
                        onClick={() => onClick(tab)}
                    >
                        <ReorderHandle {...provided.dragHandleProps} $hidden={!isEditMode}>
                            <ReorderIcon />
                        </ReorderHandle>
                        <img
                            src={tab.iconUrl}
                            onError={e => {
                                e.currentTarget.style.visibility = 'hidden';
                            }}
                        />
                        <Label2>{tab.title}</Label2>
                        {isEditMode && (
                            <CloseButton
                                onClick={e => {
                                    closeTab(tab);
                                    e.stopPropagation();
                                }}
                            >
                                <CloseIcon />
                            </CloseButton>
                        )}
                    </AsideMenuItemStyled>
                );
            }}
        </Draggable>
    );

    return (
        <Wrapper className={className}>
            <HeadingWrapper>
                <Heading>Active tabs</Heading>
                <EditButton onClick={() => setIsEditMode(m => !m)}>
                    {isEditMode ? 'Done' : 'Edit'}
                </EditButton>
            </HeadingWrapper>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="browserTabs" direction="vertical">
                    {provided => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            {tabs?.map((tab, index) => renderTabItem(tab, index))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </Wrapper>
    );
};
