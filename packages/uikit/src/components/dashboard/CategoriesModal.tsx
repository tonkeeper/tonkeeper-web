import { Notification } from '../Notification';
import React, { FC, useCallback, useEffect, useState } from 'react';
import { DragDropContext, Draggable, Droppable, OnDragEndResponder } from 'react-beautiful-dnd';
import { ListBlock, ListItemElement, ListItemPayload } from '../List';
import { DASHBOARD_COLUMNS, DashboardColumnsTranslationKeys } from './columns/DASHBOARD_COLUMNS';
import { ReorderIcon } from '../Icon';
import styled from 'styled-components';
import { Body1 } from '../Text';
import { Checkbox } from '../fields/Checkbox';
import {
    DashboardCategoriesStore,
    useDashboardCategories
} from '../../hooks/dashboard/useDashboardCategories';

export const CategoriesModal: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const child = useCallback(() => <CategoriesModalContent />, []);

    return (
        <Notification title="Dashboard metrics" isOpen={isOpen} handleClose={onClose}>
            {child}
        </Notification>
    );
};

const CategoriesModalContent: FC = () => {
    const [{ data }] = useDashboardCategories();
    const [categoriesForm, setCategoriesForm] = useState<DashboardCategoriesStore>([]);

    useEffect(() => {
        if (data) {
            setCategoriesForm(data);
        }
    }, [data]);

    const handleDrop: OnDragEndResponder = useCallback(droppedItem => {
        const destination = droppedItem.destination;
        if (!destination) return;

        setCategoriesForm(categories => {
            const updatedList = [...categories];
            const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
            updatedList.splice(destination.index, 0, reorderedItem);
            return updatedList;
        });
    }, []);

    const onCheckboxChange = (category: DASHBOARD_COLUMNS, checked: boolean) => {
        setCategoriesForm(form =>
            form.map(c => (c.name === category ? { ...c, isEnabled: checked } : c))
        );
    };
    return (
        <DragDropContext onDragEnd={handleDrop}>
            <Droppable direction="vertical" droppableId="wallets">
                {provided => (
                    <ListBlock {...provided.droppableProps} ref={provided.innerRef}>
                        {categoriesForm.map(({ name, isEnabled }, index) => (
                            <Draggable key={name} draggableId={name} index={index}>
                                {(p, snapshotDrag) => {
                                    let transform = p.draggableProps.style?.transform;

                                    if (snapshotDrag.isDragging && transform) {
                                        transform = transform.replace(/\(.+\,/, '(0,');
                                    }

                                    const style = {
                                        ...p.draggableProps.style,
                                        transform
                                    };

                                    return (
                                        <ListItemElement
                                            ios={true}
                                            hover={false}
                                            ref={p.innerRef}
                                            {...p.draggableProps}
                                            style={style}
                                        >
                                            <ListItemPayload>
                                                <Row>
                                                    <Icon {...p.dragHandleProps}>
                                                        <ReorderIcon />
                                                    </Icon>
                                                    <Body1>
                                                        {DashboardColumnsTranslationKeys[name]}
                                                    </Body1>
                                                    <CheckboxStyled
                                                        checked={isEnabled}
                                                        onChange={value =>
                                                            onCheckboxChange(
                                                                name as DASHBOARD_COLUMNS,
                                                                value
                                                            )
                                                        }
                                                    />
                                                </Row>
                                            </ListItemPayload>
                                        </ListItemElement>
                                    );
                                }}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </ListBlock>
                )}
            </Droppable>
        </DragDropContext>
    );
};

const Icon = styled.span`
    display: flex;
    color: ${props => props.theme.iconSecondary};
`;

const Row = styled.div`
    display: flex;
    gap: 0.5rem;
    align-items: center;

    width: 100%;
`;

const CheckboxStyled = styled(Checkbox)`
    margin-left: auto;
`;
