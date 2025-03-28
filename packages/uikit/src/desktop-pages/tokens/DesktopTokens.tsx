import { useVirtualizer } from '@tanstack/react-virtual';
import { isTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import styled, { css } from 'styled-components';
import { fallbackRenderOver } from '../../components/Error';
import { Body2 } from '../../components/Text';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { TokensPieChart } from '../../components/desktop/tokens/TokensPieChart';
import { AnyChainAsset, TonAsset } from '../../components/home/Jettons';
import { useTranslation } from '../../hooks/translation';
import { allChainsAssetsKeys, useAllChainsAssets } from '../../state/home';
import { useMutateUserUIPreferences, useUserUIPreferences } from '../../state/theme';

import { useAssetsDistribution } from '../../state/asset';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useAppTargetEnv } from '../../hooks/appSdk';
import { InvisibleIcon, VisibleIcon } from '../../components/Icon';
import { ForTargetEnv } from '../../components/shared/TargetEnv';
import { PullToRefresh } from '../../components/mobile-pro/PullToRefresh';

export const DesktopAssetStylesOverride = css`
    background-color: transparent;
    transition: background-color 0.15s ease-in-out;
    border-radius: 0;

    & > * {
        border-top: none !important;
    }
`;

const TonAssetStyled = styled(TonAsset)`
    margin: 0 -16px;
    > * {
        padding-top: 8px !important;
    }

    ${DesktopAssetStylesOverride}
`;

const AnyChainAssetStyled = styled(AnyChainAsset)`
    ${DesktopAssetStylesOverride}
`;

const TokensPageBody = styled.div`
    padding: 0 1rem 1rem;

    .highlight-asset {
        background-color: ${p => p.theme.backgroundContentTint};
    }
`;

const HideButton = styled.button`
    border: none;
    background-color: transparent;
    display: flex;
    align-items: center;
    gap: 5px;

    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            padding: 0.5rem 1rem;
            color: ${p.theme.textAccent};
        `}

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            justify-content: flex-start;
            width: 100%;
            > svg {
                width: 16px;
                height: 16px;
            }
        `}
`;

const Divider = styled.div`
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
    margin: 0 -16px;
    width: calc(100% + 32px);
`;

const DesktopTokensPayload = () => {
    const { assets: allAssets } = useAllChainsAssets() ?? [];
    const [tonAssetAmount, assets] = useMemo(() => {
        return [
            allAssets?.find(item => item.asset.id === TON_ASSET.id),
            allAssets?.filter(item => item.asset.id !== TON_ASSET.id)
        ];
    }, [allAssets]);
    const { t } = useTranslation();
    const { data: distribution } = useAssetsDistribution();
    const { data: uiPreferences } = useUserUIPreferences();
    const { mutate } = useMutateUserUIPreferences();
    const [showChart, setShowChart] = useState(true);
    const tonRef = useRef<HTMLDivElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        if (uiPreferences?.showTokensChart !== undefined) {
            setShowChart(uiPreferences.showTokensChart);
        }
    }, [uiPreferences?.showTokensChart]);

    const canShowChart = distribution && distribution.length >= 3;

    const onToggleChart = () => {
        mutate({ showTokensChart: !showChart });
        setShowChart(!showChart);
    };

    const env = useAppTargetEnv();
    const itemSize = env === 'mobile' ? 61 : 77;
    const chartSize = env === 'mobile' ? 388 : 192;

    const virtualScrollPaddingBase = itemSize;

    const rowVirtualizer = useVirtualizer({
        count: assets?.length ?? 0,
        getScrollElement: () => containerRef.current,
        estimateSize: () => itemSize,
        getItemKey: index => assets![index].asset.id,
        paddingStart:
            canShowChart && showChart
                ? chartSize + virtualScrollPaddingBase
                : virtualScrollPaddingBase
    });

    const onTokenClick = useCallback(
        (address: string) => {
            if (isTonAddress(address) && tonRef.current) {
                return rowVirtualizer.scrollToOffset(tonRef.current.offsetTop);
            }

            if (address === 'others') {
                return rowVirtualizer.scrollToOffset(containerRef.current!.scrollHeight);
            }

            const index = assets!.findIndex(item => item.asset.address === address);
            if (index !== undefined) {
                rowVirtualizer.scrollToOffset(
                    (tonRef.current?.offsetTop ?? 0) + (index + 1) * itemSize
                );
            }
        },
        [assets, rowVirtualizer, rowVirtualizer.elementsCache]
    );

    return (
        <DesktopViewPageLayout ref={containerRef}>
            <DesktopViewHeader borderBottom>
                <DesktopViewHeaderContent
                    title={t('jettons_list_title')}
                    right={
                        canShowChart && (
                            <DesktopViewHeaderContent.Right>
                                <DesktopViewHeaderContent.RightItem>
                                    <HideButton onClick={onToggleChart}>
                                        <ForTargetEnv env="mobile">
                                            {showChart ? <InvisibleIcon /> : <VisibleIcon />}
                                        </ForTargetEnv>
                                        <Body2>
                                            {t(
                                                showChart
                                                    ? 'tokens_hide_statistics_btn'
                                                    : 'tokens_show_statistics_btn'
                                            )}
                                        </Body2>
                                    </HideButton>
                                </DesktopViewHeaderContent.RightItem>
                            </DesktopViewHeaderContent.Right>
                        )
                    }
                />
            </DesktopViewHeader>
            <PullToRefresh invalidate={allChainsAssetsKeys} />
            <TokensPageBody
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {tonAssetAmount && assets && distribution && uiPreferences && (
                    <>
                        {canShowChart && showChart && (
                            <ErrorBoundary
                                fallbackRender={fallbackRenderOver('Failed to display pie chart')}
                            >
                                <TokensPieChart
                                    distribution={distribution}
                                    onTokenClick={onTokenClick}
                                />
                                <Divider />
                            </ErrorBoundary>
                        )}
                        <TonAssetStyled ref={tonRef} balance={tonAssetAmount} />
                        <Divider />
                        {rowVirtualizer.getVirtualItems().map(virtualRow => (
                            <div
                                key={virtualRow.index}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`
                                }}
                            >
                                <ErrorBoundary
                                    fallbackRender={fallbackRenderOver(
                                        'Failed to display tokens list'
                                    )}
                                >
                                    <AnyChainAssetStyled balance={assets[virtualRow.index]} />
                                    <Divider />
                                </ErrorBoundary>
                            </div>
                        ))}
                    </>
                )}
            </TokensPageBody>
        </DesktopViewPageLayout>
    );
};

export const DesktopTokens = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display desktop tokens')}>
            <DesktopTokensPayload />
        </ErrorBoundary>
    );
};
