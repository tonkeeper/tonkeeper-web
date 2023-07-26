import { JettonBalance } from '@tonkeeper/core/dist/tonApiV1';
import React, { FC, useCallback, useMemo } from 'react';
import {
    DragDropContext,
    Draggable,
    DraggableProvidedDragHandleProps,
    Droppable,
    OnDragEndResponder
} from 'react-beautiful-dnd';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { Radio } from '../../components/fields/Checkbox';
import { ReorderIcon } from '../../components/Icon';
import { ColumnText } from '../../components/Layout';

import { ListBlock, ListItemElement, ListItemPayload } from '../../components/List';
import { SkeletonList } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { useWalletContext } from '../../hooks/appContext';
import { useCoinFullBalance } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { hideEmptyJettons, sortJettons, useToggleJettonMutation } from '../../state/jetton';
import { useMutateWalletProperty, useWalletJettonList } from '../../state/wallet';

const Row = styled.div`
    display: flex;
    gap: 1rem;
`;
const Logo = styled.img`
    width: 44px;
    height: 44px;
    border-radius: ${props => props.theme.cornerFull};
`;

const Icon = styled.span`
    display: flex;
    color: ${props => props.theme.iconSecondary};
`;

const RadioWrapper = styled.span`
    margin: 2px;
    display: flex;
`;

const JettonRow: FC<{
    jetton: JettonBalance;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ jetton, dragHandleProps }) => {
    const { t } = useTranslation();
    const wallet = useWalletContext();

    const { mutate, reset } = useToggleJettonMutation();

    const onChange = useCallback(() => {
        reset();
        mutate(jetton);
    }, [jetton]);

    const checked = useMemo(() => {
        if (jetton.verification === 'whitelist') {
            return (wallet.hiddenJettons ?? []).every(item => item !== jetton.jettonAddress);
        } else {
            return (wallet.shownJettons ?? []).some(item => item === jetton.jettonAddress);
        }
    }, [wallet.hiddenJettons, wallet.shownJettons]);

    const balance = useCoinFullBalance(jetton.balance, jetton.metadata?.decimals);

    return (
        <ListItemPayload>
            <Row>
                <RadioWrapper>
                    <Radio checked={checked} onChange={onChange} />
                </RadioWrapper>

                <Logo src={jetton.metadata?.image} />
                <ColumnText
                    text={jetton.metadata?.name ?? t('Unknown_COIN')}
                    secondary={`${balance} ${jetton.metadata?.symbol}`}
                />
            </Row>
            <Icon {...dragHandleProps}>
                <ReorderIcon />
            </Icon>
        </ListItemPayload>
    );
};

const JettonSkeleton = () => {
    const { t } = useTranslation();

    return (
        <>
            <SubHeader title={t('settings_jettons_list')} />
            <SkeletonList size={5} />
        </>
    );
};
export const JettonsSettings = () => {
    const { t } = useTranslation();
    const wallet = useWalletContext();
    const { data } = useWalletJettonList();

    const jettons = useMemo(() => {
        const sort = sortJettons(wallet.orderJettons, data?.balances ?? []);
        return hideEmptyJettons(sort);
    }, [data, wallet.orderJettons]);

    const { mutate } = useMutateWalletProperty();
    const handleDrop: OnDragEndResponder = useCallback(
        droppedItem => {
            if (!droppedItem.destination) return;
            const updatedList = [...jettons];
            const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
            updatedList.splice(droppedItem.destination.index, 0, reorderedItem);
            mutate({ orderJettons: updatedList.map(item => item.jettonAddress) });
        },
        [jettons, mutate]
    );

    if (!data) {
        return <JettonSkeleton />;
    }

    return (
        <>
            <SubHeader title={t('settings_jettons_list')} />
            <InnerBody>
                <DragDropContext onDragEnd={handleDrop}>
                    <Droppable droppableId="jettons">
                        {provided => (
                            <ListBlock
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                noUserSelect
                            >
                                {jettons.map((jetton, index) => (
                                    <Draggable
                                        key={jetton.jettonAddress}
                                        draggableId={jetton.jettonAddress}
                                        index={index}
                                    >
                                        {p => (
                                            <ListItemElement
                                                ref={p.innerRef}
                                                {...p.draggableProps}
                                                hover={false}
                                                ios={true}
                                            >
                                                <JettonRow
                                                    dragHandleProps={p.dragHandleProps}
                                                    jetton={jetton}
                                                />
                                            </ListItemElement>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </ListBlock>
                        )}
                    </Droppable>
                </DragDropContext>
            </InnerBody>
        </>
    );
};
