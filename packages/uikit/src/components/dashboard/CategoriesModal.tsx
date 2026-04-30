import { Notification, NotificationFooter } from '../Notification';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
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
import { DashboardColumn } from '@tonkeeper/core/dist/entries/dashboard';
import { useTranslation } from '../../hooks/translation';
import { isValidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { useProFeaturesNotification } from '../modals/ProFeaturesNotificationControlled';

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
    const { data } = useDashboardColumnsAsForm();
    const [categoriesForm, setCategoriesForm] = useState<DashboardColumnsForm>([]);

    useEffect(() => {
        if (data) {
            setCategoriesForm(data);
        }
    }, [data]);

    const child = useCallback(
        () => (
            <CategoriesModalContent
                categories={data || []}
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
        return JSON.stringify(data) !== JSON.stringify(categoriesForm);
    }, [categoriesForm, data]);

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

const SortableCategoryItem: FC<{
    id: string;
    isEnabled: boolean;
    categories: DashboardColumn[];
    isProEnabled: boolean;
    onOpen: () => void;
    onCheckboxChange: (id: string, checked: boolean) => void;
}> = ({ id, isEnabled, categories, isProEnabled, onOpen, onCheckboxChange }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition
    };
    const category = categories.find(c => c.id === id);
    const isDisabled = category?.onlyPro && !isProEnabled;

    return (
        <ListItemElement
            ios={true}
            hover={false}
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <ListItemPayload>
                <Row onClick={() => isDisabled && onOpen()}>
                    <Icon {...listeners}>
                        <ReorderIcon />
                    </Icon>
                    <Body1>{category?.name}</Body1>
                    {category?.onlyPro && <Badge>PRO</Badge>}
                    <CheckboxStyled
                        checked={isEnabled}
                        disabled={isDisabled}
                        onChange={value => !isDisabled && onCheckboxChange(id, value)}
                    />
                </Row>
            </ListItemPayload>
        </ListItemElement>
    );
};

const CategoriesModalContent: FC<{
    categories: DashboardColumn[];
    categoriesForm: DashboardColumnsForm;
    setCategoriesForm: (
        data: DashboardColumnsForm | ((data: DashboardColumnsForm) => DashboardColumnsForm)
    ) => void;
}> = ({ categories, categoriesForm, setCategoriesForm }) => {
    const { data: subscription } = useProState();
    const { onOpen } = useProFeaturesNotification();
    const isProEnabled = isValidSubscription(subscription);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            setCategoriesForm(_categories => {
                const oldIndex = _categories.findIndex(c => c.id === active.id);
                const newIndex = _categories.findIndex(c => c.id === over.id);
                if (oldIndex === -1 || newIndex === -1) return _categories;
                return arrayMove([..._categories], oldIndex, newIndex);
            });
        },
        [setCategoriesForm]
    );

    const onCheckboxChange = (categoryId: string, checked: boolean) => {
        setCategoriesForm(form =>
            form.map(c => (c.id === categoryId ? { ...c, isEnabled: checked } : c))
        );
    };

    return (
        <>
            <DndContext
                sensors={sensors}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                <SortableContext
                    items={categoriesForm.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <ListBlock>
                        {categoriesForm.map(({ id, isEnabled }) => (
                            <SortableCategoryItem
                                key={id}
                                id={id}
                                isEnabled={isEnabled}
                                categories={categories}
                                isProEnabled={isProEnabled}
                                onOpen={onOpen}
                                onCheckboxChange={onCheckboxChange}
                            />
                        ))}
                    </ListBlock>
                </SortableContext>
            </DndContext>
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
