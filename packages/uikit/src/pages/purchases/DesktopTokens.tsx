import { InnerBody } from '../../components/Body';
import { JettonAsset, TonAsset } from '../../components/home/Jettons';
import { useAssets } from '../../state/home';
import { TokensPieChart } from '../../components/desktop/tokens/TokensPieChart';
import styled, { css } from 'styled-components';
import { Body2, Label2 } from '../../components/Text';
import { useTranslation } from '../../hooks/translation';
import { useAssetsDistribution } from '../../state/wallet';
import { useMutateUserUIPreferences, useUserUIPreferences } from '../../state/theme';
import { useLayoutEffect, useState } from 'react';

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
    height: 44px;
    padding-left: 1rem;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid ${p => p.theme.separatorCommon};
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
        <>
            <TokensHeaderContainer>
                <Label2>{t('jettons_list_title')}</Label2>
                {canShowChart && (
                    <HideButton onClick={onToggleChart}>
                        <Body2>{showChart ? 'Hide Statistics' : 'Show Statistics'}</Body2>
                    </HideButton>
                )}
            </TokensHeaderContainer>
            <InnerBody>
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
            </InnerBody>
        </>
    );
};
