import { useVirtualizer } from '@tanstack/react-virtual';
import { isTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import styled, { css } from 'styled-components';
import { fallbackRenderOver } from '../../components/Error';
import { Body2, Label2 } from '../../components/Text';
import {
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { TokensPieChart } from '../../components/desktop/tokens/TokensPieChart';
import { JettonAsset, TonAsset } from '../../components/home/Jettons';
import { useTranslation } from '../../hooks/translation';
import { useAssets } from '../../state/home';
import { useMutateUserUIPreferences, useUserUIPreferences } from '../../state/theme';

import { useAssetsDistribution } from "../../state/asset";

const DesktopAssetStylesOverride = css`
    background-color: transparent;
    transition: background-color 0.15s ease-in-out;
    border-radius: 0;

    & > * {
        border-top: none !important;
    }
`;

const TonAssetStyled = styled(TonAsset)`
    margin: 0 -16px;

    ${DesktopAssetStylesOverride}
`;

const JettonAssetStyled = styled(JettonAsset)`
    ${DesktopAssetStylesOverride}
`;

const TokensHeaderContainer = styled(DesktopViewHeader)`
    flex-shrink: 0;
    justify-content: space-between;
    border-bottom: 1px solid ${p => p.theme.separatorCommon};
    padding-right: 0;
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
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;

    color: ${p => p.theme.textAccent};
`;

const Divider = styled.div`
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
    margin: 0 -16px;
    width: calc(100% + 32px);
`;

const itemSize = 77;

const DesktopTokensPayload = () => {
    const [assets] = useAssets();
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

    const sortedAssets = useMemo(() => {
        return assets?.ton?.jettons?.balances ?? [];
    }, [assets]);

    const rowVirtualizer = useVirtualizer({
        count: sortedAssets.length,
        getScrollElement: () => containerRef.current,
        estimateSize: () => itemSize,
        getItemKey: index => sortedAssets[index].jetton.address,
        paddingStart: canShowChart && showChart ? 192 + itemSize : itemSize
    });

    const onTokenClick = useCallback(
        (address: string) => {
            if (isTonAddress(address) && tonRef.current) {
                return rowVirtualizer.scrollToOffset(tonRef.current.offsetTop);
            }

            if (address === 'others') {
                return rowVirtualizer.scrollToOffset(containerRef.current!.scrollHeight);
            }

            const index = sortedAssets.findIndex(item => item.jetton.address === address);
            if (index !== undefined) {
                rowVirtualizer.scrollToOffset(
                    (tonRef.current?.offsetTop ?? 0) + (index + 1) * itemSize
                );
            }
        },
        [sortedAssets, rowVirtualizer, rowVirtualizer.elementsCache]
    );

    return (
        <DesktopViewPageLayout ref={containerRef}>
            <TokensHeaderContainer>
                <Label2>{t('jettons_list_title')}</Label2>
                {canShowChart && (
                    <HideButton onClick={onToggleChart}>
                        <Body2>
                            {t(
                                showChart
                                    ? 'tokens_hide_statistics_btn'
                                    : 'tokens_show_statistics_btn'
                            )}
                        </Body2>
                    </HideButton>
                )}
            </TokensHeaderContainer>
            <TokensPageBody
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {sortedAssets && assets && distribution && uiPreferences && (
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
                        <TonAssetStyled ref={tonRef} info={assets.ton.info} />
                        <Divider />
                        {rowVirtualizer.getVirtualItems().map(virtualRow => (
                            <div
                                key={virtualRow.index}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: `100%`,
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`
                                }}
                            >
                                <ErrorBoundary
                                    fallbackRender={fallbackRenderOver(
                                        'Failed to display tokens list'
                                    )}
                                >
                                    <JettonAssetStyled jetton={sortedAssets[virtualRow.index]} />
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
