import { Notification, NotificationFooter } from '../Notification';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, Draggable, Droppable, OnDragEndResponder } from 'react-beautiful-dnd';
import { ListBlock, ListItemElement, ListItemPayload } from '../List';
import { ReorderIcon } from '../Icon';
import styled from 'styled-components';
import { Body1 } from '../Text';
import { Checkbox } from '../fields/Checkbox';
import {
    DashboardColumnsForm,
    useDashboardColumnsAsForm,
    useDashboardColumnsForm
} from '../../state/dashboard/useDashboardColumns';
import { Button } from '../fields/Button';
import { Badge } from '../shared';
import { useProState } from '../../state/pro';
import { ProNotification } from '../pro/ProNotification';
import { useDisclosure } from '../../hooks/useDisclosure';
import { DashboardColumn } from '@tonkeeper/core/dist/entries/dashboard';
import { useTranslation } from '../../hooks/translation';
import { HideOnReview } from '../ios/HideOnReview';
import { isFreeSubscription } from '@tonkeeper/core/dist/entries/pro';

const HeaderStyled = styled.div`
    width: 100%;
    padding-left: 48px;
    text-align: center;
    box-sizing: border-box;
`;

export const CategoriesModal: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const { t } = useTranslation();
    const [_, { mutate, isLoading }] = useDashboardColumnsForm();
    const [categoriesForm, setCategoriesForm] = useState<DashboardColumnsForm>([]);

    const { data: pro } = useProState();
    const isFreePro = isFreeSubscription(pro?.subscription);

    const { data } = useDashboardColumnsAsForm();
    const categories = useMemo(() => {
        if (isFreePro) {
            return data?.filter(i => !i.onlyPro);
        }

        return data;
    }, [data, isFreePro]);

    useEffect(() => {
        if (categories) {
            setCategoriesForm(categories);
        }
    }, [categories]);

    const child = useCallback(
        () => (
            <CategoriesModalContent
                categories={categories || []}
                categoriesForm={categoriesForm}
                setCategoriesForm={setCategoriesForm}
            />
        ),
        [categoriesForm, setCategoriesForm]
    );

    const onSave = () => {
        mutate(categoriesForm, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    const formHasChanged = useMemo(() => {
        return JSON.stringify(categories) !== JSON.stringify(categoriesForm);
    }, [categoriesForm, categories]);

    return (
        <Notification
            isOpen={isOpen}
            handleClose={onClose}
            title={<HeaderStyled>{t('dashboard_manage_modal_title')}</HeaderStyled>}
            footer={
                <NotificationFooter>
                    <Button
                        size="large"
                        primary
                        fullWidth
                        type="button"
                        loading={isLoading}
                        disabled={isLoading || !formHasChanged}
                        onClick={onSave}
                    >
                        {t('save')}
                    </Button>
                </NotificationFooter>
            }
        >
            {child}
        </Notification>
    );
};

const CategoriesModalContent: FC<{
    categories: DashboardColumn[];
    categoriesForm: DashboardColumnsForm;
    setCategoriesForm: (
        data: DashboardColumnsForm | ((data: DashboardColumnsForm) => DashboardColumnsForm)
    ) => void;
}> = ({ categories, categoriesForm, setCategoriesForm }) => {
    const { data } = useProState();
    const isProEnabled = data?.subscription.valid;
    const { isOpen, onClose, onOpen } = useDisclosure();

    const handleDrop: OnDragEndResponder = useCallback(droppedItem => {
        const destination = droppedItem.destination;
        if (!destination) return;

        setCategoriesForm(_categories => {
            const updatedList = [..._categories];
            const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
            updatedList.splice(destination.index, 0, reorderedItem);
            return updatedList;
        });
    }, []);

    const onCheckboxChange = (categoryId: string, checked: boolean) => {
        setCategoriesForm(form =>
            form.map(c => (c.id === categoryId ? { ...c, isEnabled: checked } : c))
        );
    };
    return (
        <>
            <DragDropContext onDragEnd={handleDrop}>
                <Droppable direction="vertical" droppableId="wallets">
                    {provided => (
                        <ListBlock {...provided.droppableProps} ref={provided.innerRef}>
                            {categoriesForm.map(({ id, isEnabled }, index) => (
                                <Draggable key={id} draggableId={id} index={index}>
                                    {(p, snapshotDrag) => {
                                        let transform = p.draggableProps.style?.transform;

                                        if (snapshotDrag.isDragging && transform) {
                                            transform = transform.replace(/\(.+\,/, '(0,');
                                        }

                                        const style = {
                                            ...p.draggableProps.style,
                                            transform
                                        };

                                        const category = categories.find(c => c.id === id);
                                        const isDisabled = category?.onlyPro && !isProEnabled;

                                        return (
                                            <ListItemElement
                                                ios={true}
                                                hover={false}
                                                ref={p.innerRef}
                                                {...p.draggableProps}
                                                style={style}
                                            >
                                                <ListItemPayload>
                                                    <Row onClick={() => isDisabled && onOpen()}>
                                                        <Icon {...p.dragHandleProps}>
                                                            <ReorderIcon />
                                                        </Icon>
                                                        <Body1>{category?.name}</Body1>
                                                        <HideOnReview>
                                                            {category?.onlyPro && (
                                                                <Badge>PRO</Badge>
                                                            )}
                                                        </HideOnReview>
                                                        <CheckboxStyled
                                                            checked={isEnabled}
                                                            disabled={isDisabled}
                                                            onChange={value =>
                                                                !isDisabled &&
                                                                onCheckboxChange(id, value)
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
            <ProNotification isOpen={isOpen} onClose={onClose} />
        </>
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
