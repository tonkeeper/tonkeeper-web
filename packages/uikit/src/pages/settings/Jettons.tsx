import { TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';
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
import { useTranslation } from '../../hooks/translation';
import {
    useJettonRawList,
    useSavePinnedJettonOrderMutation,
    useToggleHideJettonMutation,
    useTogglePinJettonMutation
} from '../../state/jetton';
import { useActiveTonWalletConfig } from '../../state/wallet';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    assetAddressToString,
    jettonToTonAssetAmount
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useTronBalances } from '../../state/tron/tron';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

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
const Logo = styled.img<{ $noCorners?: boolean }>`
    width: 44px;
    height: 44px;
    border-radius: ${props => (props.$noCorners ? 'none' : props.theme.cornerFull)};
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

const SampleJettonRow: FC<{ jetton: AssetAmount; config: TonWalletConfig }> = ({
    jetton,
    config
}) => {
    const { t } = useTranslation();

    const jettonAddress = assetAddressToString(jetton.asset.address);

    const { mutate: togglePin } = useTogglePinJettonMutation();
    const { mutate: toggleHide } = useToggleHideJettonMutation();

    const visible = useMemo(() => {
        return !config.hiddenTokens.includes(jettonAddress);
    }, [config.hiddenTokens]);

    const pinned = useMemo(() => {
        return config.pinnedTokens.includes(jettonAddress);
    }, [config.pinnedTokens]);

    return (
        <ListItemPayload>
            <Row>
                <Logo
                    src={jetton.asset.image}
                    $noCorners={jetton.asset.id === TRON_USDT_ASSET.id}
                />
                <ColumnText
                    text={jetton.asset.name ?? t('Unknown_COIN')}
                    secondary={jetton.stringAssetRelativeAmount}
                />
            </Row>
            <Row>
                {visible && (
                    <RadioWrapper onClick={() => togglePin({ config, jettonAddress })}>
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
                <RadioWrapper onClick={() => toggleHide({ config, jettonAddress })}>
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
    jettons: AssetAmount[];
}> = ({ config, jettons }) => {
    const { mutate } = useSavePinnedJettonOrderMutation();

    const list = useMemo(
        () =>
            config.pinnedTokens.reduce((acc, item) => {
                const jetton = jettons.find(j => assetAddressToString(j.asset.address) === item);
                if (jetton) {
                    acc.push(jetton);
                }
                return acc;
            }, [] as AssetAmount[]),
        [jettons, config]
    );

    const handleDrop: OnDragEndResponder = useCallback(
        droppedItem => {
            if (!droppedItem.destination) return;
            const updatedList = [...list];
            const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1);
            updatedList.splice(droppedItem.destination.index, 0, reorderedItem);

            const pinnedTokens = updatedList.map(item => assetAddressToString(item.asset.address));
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
                                key={jetton.asset.id}
                                draggableId={jetton.asset.id}
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
    jetton: AssetAmount;
    config: TonWalletConfig;
    dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
}> = ({ jetton, config, dragHandleProps }) => {
    const { t } = useTranslation();

    const { mutate: togglePin } = useTogglePinJettonMutation();

    return (
        <ListItemPayload>
            <Row>
                <Logo
                    src={jetton.asset.image}
                    $noCorners={jetton.asset.id === TRON_USDT_ASSET.id}
                />
                <ColumnText
                    text={jetton.asset.name ?? t('Unknown_COIN')}
                    secondary={jetton.stringAssetRelativeAmount}
                />
            </Row>
            <Row>
                <RadioWrapper
                    onClick={() =>
                        togglePin({
                            config,
                            jettonAddress: assetAddressToString(jetton.asset.address)
                        })
                    }
                >
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
    const { data: tronBalances } = useTronBalances();
    const { data: config } = useActiveTonWalletConfig();

    const assets = useMemo(() => {
        if (!jettons || tronBalances === undefined) {
            return undefined;
        }

        const tonAssets = jettons.balances.map(jettonToTonAssetAmount);
        if (!tronBalances?.usdt) {
            return tonAssets as AssetAmount[];
        }

        return [tronBalances.usdt as AssetAmount].concat(tonAssets as AssetAmount[]);
    }, [jettons, tronBalances]);

    if (!assets || !config) {
        return <JettonSkeleton />;
    }

    return (
        <>
            <SubHeader title={t('settings_jettons_list')} />
            <InnerBody>
                {config.pinnedTokens.length > 0 ? (
                    <>
                        <Title>{t('pinned_jettons')}</Title>
                        <PinnedJettonList jettons={assets} config={config} />
                    </>
                ) : undefined}

                <Title>{t('all_assets_jettons')}</Title>
                <ListBlock>
                    {assets.map(jetton => (
                        <ListItemElement key={jetton.asset.id} hover={false} ios={true}>
                            <SampleJettonRow jetton={jetton} config={config} />
                        </ListItemElement>
                    ))}
                </ListBlock>
            </InnerBody>
        </>
    );
};
