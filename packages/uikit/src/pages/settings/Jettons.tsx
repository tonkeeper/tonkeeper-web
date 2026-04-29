import { TonWalletConfig } from '@tonkeeper/core/dist/entries/wallet';
import React, { FC, useCallback, useMemo } from 'react';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { InvisibleIcon, PinIcon, ReorderIcon, VisibleIcon } from '../../components/Icon';
import { ColumnText } from '../../components/Layout';
import { ListBlock, ListItemElement, ListItemPayload } from '../../components/List';
import { SkeletonListWithImages } from '../../components/Skeleton';
import { SubHeader } from '../../components/SubHeader';
import { Body3, H3 } from '../../components/Text';
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
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { JettonVerificationType } from '@tonkeeper/core/dist/tonApiV2';
import { Image } from '../../components/shared/Image';

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
const Logo = styled(Image)`
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

const TextWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const Body3Orange = styled(Body3)`
    color: ${p => p.theme.accentOrange};
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
                <Logo src={jetton.asset.image} noRadius={jetton.asset.noImageCorners} />
                <TextWrapper>
                    <ColumnText
                        text={jetton.asset.name ?? t('Unknown_COIN')}
                        secondary={jetton.stringAssetRelativeAmount}
                    />
                    {isTonAsset(jetton.asset) &&
                        jetton.asset.verification !== JettonVerificationType.Whitelist && (
                            <Body3Orange>{t('approval_unverified_token')}</Body3Orange>
                        )}
                </TextWrapper>
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

type DragHandleProps = React.HTMLAttributes<HTMLElement> | undefined;

const SortablePinnedJettonItem: FC<{ jetton: AssetAmount; config: TonWalletConfig }> = ({
    jetton,
    config
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: jetton.asset.id
    });
    const style: React.CSSProperties = {
        transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
        transition
    };
    return (
        <ListItemElement
            ref={setNodeRef}
            style={style}
            hover={false}
            ios={true}
            {...attributes}
        >
            <JettonRow
                config={config}
                dragHandleProps={listeners as DragHandleProps}
                jetton={jetton}
            />
        </ListItemElement>
    );
};

export const PinnedJettonList: FC<{
    config: TonWalletConfig;
    jettons: AssetAmount[];
}> = ({ config, jettons }) => {
    const { mutate } = useSavePinnedJettonOrderMutation();
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;
            const oldIndex = list.findIndex(j => j.asset.id === String(active.id));
            const newIndex = list.findIndex(j => j.asset.id === String(over.id));
            if (oldIndex === -1 || newIndex === -1) return;
            const updatedList = arrayMove([...list], oldIndex, newIndex);
            const pinnedTokens = updatedList.map(item => assetAddressToString(item.asset.address));
            mutate({ config, pinnedTokens });
        },
        [config, list, mutate]
    );

    return (
        <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
        >
            <SortableContext
                items={list.map(j => j.asset.id)}
                strategy={verticalListSortingStrategy}
            >
                <ListBlock noUserSelect>
                    {list.map(jetton => (
                        <SortablePinnedJettonItem
                            key={jetton.asset.id}
                            jetton={jetton}
                            config={config}
                        />
                    ))}
                </ListBlock>
            </SortableContext>
        </DndContext>
    );
};

const JettonRow: FC<{
    jetton: AssetAmount;
    config: TonWalletConfig;
    dragHandleProps: DragHandleProps;
}> = ({ jetton, config, dragHandleProps }) => {
    const { t } = useTranslation();

    const { mutate: togglePin } = useTogglePinJettonMutation();

    return (
        <ListItemPayload>
            <Row>
                <Logo src={jetton.asset.image} noRadius={jetton.asset.noImageCorners} />
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

const useSettingsAssets = () => {
    const { data: jettons } = useJettonRawList();
    const { data: tronBalances } = useTronBalances();

    return useMemo(() => {
        if (!jettons || tronBalances === undefined) {
            return undefined;
        }

        const tonAssets = jettons.balances.map(jettonToTonAssetAmount);
        if (!tronBalances?.usdt) {
            return tonAssets as AssetAmount[];
        }

        return [tronBalances.usdt as AssetAmount].concat(tonAssets as AssetAmount[]);
    }, [jettons, tronBalances]);
};

export const JettonsSettings = () => {
    const isFullWidth = useIsFullWidthMode();

    if (isFullWidth) {
        return <JettonsSettingsProMode />;
    }

    return <JettonsSettingsClassicMode />;
};

const JettonsSettingsClassicMode = () => {
    const { t } = useTranslation();

    const { data: config } = useActiveTonWalletConfig();
    const assets = useSettingsAssets();

    if (!assets || !config) {
        return <JettonSkeleton />;
    }

    return (
        <>
            <SubHeader title={t('settings_jettons_list')} />
            <InnerBody>
                <JettonsSettingsContent config={config} assets={assets} />
            </InnerBody>
        </>
    );
};

const DesktopContentWrapper = styled.div`
    padding: 0 1rem;
`;

const JettonsSettingsProMode = () => {
    const { data: config } = useActiveTonWalletConfig();
    const assets = useSettingsAssets();
    const { t } = useTranslation();

    if (!assets || !config) {
        return (
            <DesktopViewPageLayout>
                <DesktopViewHeader backButton>
                    <DesktopViewHeaderContent title={t('settings_jettons_list')} />
                </DesktopViewHeader>
                <DesktopContentWrapper>
                    <SkeletonListWithImages size={5} />
                </DesktopContentWrapper>
            </DesktopViewPageLayout>
        );
    }

    return (
        <DesktopViewPageLayout>
            <DesktopViewHeader backButton>
                <DesktopViewHeaderContent title={t('settings_jettons_list')} />
            </DesktopViewHeader>

            <DesktopContentWrapper>
                <JettonsSettingsContent config={config} assets={assets} />
            </DesktopContentWrapper>
        </DesktopViewPageLayout>
    );
};

const JettonsSettingsContent: FC<{ config: TonWalletConfig; assets: AssetAmount[] }> = ({
    config,
    assets
}) => {
    const { t } = useTranslation();
    return (
        <>
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
        </>
    );
};
