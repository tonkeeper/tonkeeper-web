import { TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';
import { JettonBalance } from '@tonkeeper/core/dist/tonApiV2';
import { FC, useCallback, useMemo } from 'react';
import {
    DragDropContext,
    Draggable,
    DraggableProvidedDragHandleProps,
    Droppable,
    OnDragEndResponder
} from 'react-beautiful-dnd';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { InvisibleIcon, PinIcon, ReorderIcon, VisibleIcon } from '../../components/Icon';
import { ColumnText } from '../../components/Layout';
import { ListBlock, ListItemElement, ListItemPayload } from '../../components/List';
import { SkeletonListWithImages } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { H3 } from '../../components/Text';
import { useCoinFullBalance } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import {
    useJettonRawList,
    useSavePinnedJettonOrderMutation,
    useToggleHideJettonMutation,
    useTogglePinJettonMutation
} from '../../state/jetton';
import { useActiveTonWalletConfig } from '../../state/wallet';

const TurnOnIcon = styled.span`
    color: ${props => props.theme.accentBlue};
    display: flex;
`;

const TurnOffIcon = styled.span`
    color: ${props => props.theme.iconSecondary};
    display: flex;
`;

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
    cursor: pointer;
`;

const SampleJettonRow: FC<{ jetton: JettonBalance; config: TonWalletConfig }> = ({
    jetton,
    config
}) => {
    const { t } = useTranslation();

    const balance = useCoinFullBalance(jetton.balance, jetton.jetton.decimals);

    const { mutate: togglePin } = useTogglePinJettonMutation();
    const { mutate: toggleHide } = useToggleHideJettonMutation();

    const visible = useMemo(() => {
        return !config.hiddenTokens.includes(jetton.jetton.address);
    }, [config.hiddenTokens]);

    const pinned = useMemo(() => {
        return config.pinnedTokens.includes(jetton.jetton.address);
    }, [config.pinnedTokens]);

    return (
        <ListItemPayload>
            <Row>
                <Logo src={jetton.jetton.image} />
                <ColumnText
                    text={jetton.jetton.name ?? t('Unknown_COIN')}
                    secondary={`${balance} ${jetton.jetton.symbol}`}
                />
            </Row>
            <Row>
                {visible && (
                    <RadioWrapper onClick={() => togglePin({ config, jetton })}>
                        {pinned ? (
                            <TurnOnIcon>
                                <PinIcon />
                            </TurnOnIcon>
                        ) : (
                            <TurnOffIcon>
                                <PinIcon />
                            </TurnOffIcon>
                        )}
                    </RadioWrapper>
                )}
                <RadioWrapper onClick={() => toggleHide({ config, jetton })}>
                    {visible ? (
                        <TurnOnIcon>
                            <VisibleIcon />
                        </TurnOnIcon>
                    ) : (
                        <TurnOffIcon>
                            <InvisibleIcon />
                        </TurnOffIcon>
                    )}
                </RadioWrapper>
            </Row>
        </ListItemPayload>
    );
};

export const PinnedJettonList: FC<{
    config: TonWalletConfig;
    jettons: JettonBalance[];
}> = ({ config, jettons }) => {
    const { mutate } = useSavePinnedJettonOrderMutation();

    const list = useMemo(
        () =>
            config.pinnedTokens.reduce((acc, item) => {
                const jetton = jettons.find(j => j.jetton.address === item);
                if (jetton) {
                    acc.push(jetton);
                }
                return acc;
            }, [] as JettonBalance[]),
        [jettons, config]
    );

    const handleDrop: OnDragEndResponder = useCallback(
        droppedItem => {
            if (!droppedItem.destination) return;
            const updatedList = [...list];
            const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
            updatedList.splice(droppedItem.destination.index, 0, reorderedItem);

            const pinnedTokens = updatedList.map(item => item.jetton.address);
            mutate({ config, pinnedTokens });
        },
        [config, list, mutate]
    );

    return (
        <DragDropContext onDragEnd={handleDrop}>
            <Droppable droppableId="jettons">
                {provided => (
                    <ListBlock {...provided.droppableProps} ref={provided.innerRef} noUserSelect>
                        {list.map((jetton, index) => (
                            <Draggable
                                key={jetton.jetton.address}
                                draggableId={jetton.jetton.address}
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
                                            config={config}
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
            </Droppable>{' '}
        </DragDropContext>
    );
};

const JettonRow: FC<{
    jetton: JettonBalance;
    config: TonWalletConfig;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ jetton, config, dragHandleProps }) => {
    const { t } = useTranslation();

    const { mutate: togglePin } = useTogglePinJettonMutation();

    const balance = useCoinFullBalance(jetton.balance, jetton.jetton.decimals);

    return (
        <ListItemPayload>
            <Row>
                <Logo src={jetton.jetton.image} />
                <ColumnText
                    text={jetton.jetton.name ?? t('Unknown_COIN')}
                    secondary={`${balance} ${jetton.jetton.symbol}`}
                />
            </Row>
            <Row>
                <RadioWrapper onClick={() => togglePin({ config, jetton })}>
                    <TurnOnIcon>
                        <PinIcon />
                    </TurnOnIcon>
                </RadioWrapper>
                <Icon {...dragHandleProps}>
                    <ReorderIcon />
                </Icon>
            </Row>
        </ListItemPayload>
    );
};

const JettonSkeleton = () => {
    const { t } = useTranslation();

    return (
        <>
            <SubHeader title={t('settings_jettons_list')} />
            <InnerBody>
                <SkeletonListWithImages size={5} />
            </InnerBody>
        </>
    );
};

const Title = styled(H3)`
    margin: 14px 0;
`;

export const JettonsSettings = () => {
    const { t } = useTranslation();

    const { data: jettons } = useJettonRawList();
    const { data: config } = useActiveTonWalletConfig();

    if (!jettons || !config) {
        return <JettonSkeleton />;
    }

    return (
        <>
            <SubHeader title={t('settings_jettons_list')} />
            <InnerBody>
                {config.pinnedTokens.length > 0 ? (
                    <>
                        <Title>{t('pinned_jettons')}</Title>
                        <PinnedJettonList jettons={jettons.balances} config={config} />
                    </>
                ) : undefined}

                <Title>{t('all_assets_jettons')}</Title>
                <ListBlock>
                    {jettons.balances.map(jetton => (
                        <ListItemElement key={jetton.jetton.address} hover={false} ios={true}>
                            <SampleJettonRow jetton={jetton} config={config} />
                        </ListItemElement>
                    ))}
                </ListBlock>
            </InnerBody>
        </>
    );
};
