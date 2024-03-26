import { JettonAsset, TonAsset } from '../../components/home/Jettons';
import { useAssets } from '../../state/home';
import { TokensPieChart } from '../../components/desktop/tokens/TokensPieChart';
import styled, { css } from 'styled-components';
import { Body2, Label2 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import { useAssetsDistribution } from '../../state/wallet';
import { useMutateUserUIPreferences, useUserUIPreferences } from '../../state/theme';
import { useLayoutEffect, useState } from 'react';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';

const DesktopAssetStylesOverride = css`
    background-color: transparent;
    transition: background-color 0.2s ease-in-out;
    margin: 1px -15px;
    border-radius: 0;

    & > * {
        border-top: none !important;
    }
`;

const TonAssetStyled = styled(TonAsset)`
    ${DesktopAssetStylesOverride}
`;

const JettonAssetStyled = styled(JettonAsset)`
    ${DesktopAssetStylesOverride}
`;

const TokensHeaderContainer = styled.div`
    height: 37px;
    padding-left: 1rem;
    padding-bottom: 0.5rem;
    box-sizing: content-box;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid ${p => p.theme.separatorCommon};
`;

const TokensPageBody = styled.div`
    padding: 0 1rem 1rem;
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

export const DesktopTokens = () => {
    const [assets] = useAssets();
    const { t } = useTranslation();
    const { data: distribution } = useAssetsDistribution();
    const { data: uiPreferences } = useUserUIPreferences();
    const { mutate } = useMutateUserUIPreferences();
    const [showChart, setShowChart] = useState(true);

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

    return (
        <DesktopViewPageLayout>
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
            <TokensPageBody>
                {assets && distribution && uiPreferences && (
                    <>
                        {canShowChart && showChart && (
                            <>
                                <TokensPieChart distribution={distribution} />
                                <Divider />
                            </>
                        )}
                        <TonAssetStyled info={assets.ton.info} />
                        <Divider />
                        {assets.ton.jettons.balances.map(jetton => (
                            <>
                                <JettonAssetStyled key={jetton.jetton.address} jetton={jetton} />
                                <Divider />
                            </>
                        ))}
                    </>
                )}
            </TokensPageBody>
        </DesktopViewPageLayout>
    );
};
