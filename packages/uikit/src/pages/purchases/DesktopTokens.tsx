import { InnerBody } from '../../components/Body';
import { TokensHeader } from '../../components/Header';
import { JettonAsset, TonAsset } from '../../components/home/Jettons';
import { useAssets } from '../../state/home';
import { TokensPieChart } from '../../components/desktop/tokens/TokensPieChart';
import styled, { css } from 'styled-components';

const DesktopAssetStylesOverride = css`
    background-color: transparent;
    transition: background-color 0.2s ease-in-out;
    border-radius: ${p => p.theme.corner2xSmall};

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

export const DesktopTokens = () => {
    const [assets] = useAssets();
    return (
        <>
            <TokensHeader />
            <InnerBody>
                {assets && (
                    <>
                        <TokensPieChart />
                        <TonAssetStyled info={assets.ton.info} />
                        {assets.ton.jettons.balances.map(jetton => (
                            <JettonAssetStyled key={jetton.jetton.address} jetton={jetton} />
                        ))}
                    </>
                )}
            </InnerBody>
        </>
    );
};
