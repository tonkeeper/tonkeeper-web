import styled from 'styled-components';
import { WidgetHeader } from './common';
import { useTranslation } from '../../../../hooks/translation';
import { AppRoute } from '../../../../libs/routes';
import { AnyChainAsset, TonAsset } from '../../../home/Jettons';
import { TronAssets } from '../../../home/TronAssets';
import { DesktopAssetStylesOverride } from '../../../../desktop-pages/tokens/DesktopTokens';
import { useAllChainsAssets } from '../../../../state/home';
import { useMemo } from 'react';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useActiveTronWallet, useCanUseTronForActiveWallet } from '../../../../state/tron/tron';

const Wrapper = styled.div`
    padding-top: 0.5rem;
`;

const TonAssetStyled = styled(TonAsset)`
    ${DesktopAssetStylesOverride}
`;

const TronAssetsStyled = styled(TronAssets)`
    ${DesktopAssetStylesOverride}
`;

const AnyChainAssetStyled = styled(AnyChainAsset)`
    ${DesktopAssetStylesOverride}
`;

const Divider = styled.div`
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
    width: 100%;
`;

const Skeletons = () => {
    return null;
};

export const MobileProHomeWidgetTokens = () => {
    const { t } = useTranslation();
    const { assets: allAssets } = useAllChainsAssets() ?? [];
    const [tonAssetAmount, assets] = useMemo(() => {
        return [
            allAssets?.find(item => item.asset.id === TON_ASSET.id),
            allAssets?.filter(item => item.asset.id !== TON_ASSET.id).slice(0, 2)
        ];
    }, [allAssets]);
    const tronWallet = useActiveTronWallet();
    const canUseTron = useCanUseTronForActiveWallet();

    return (
        <Wrapper>
            <WidgetHeader to={AppRoute.coins}>{t('wallet_aside_tokens')}</WidgetHeader>
            {tonAssetAmount && assets ? (
                <>
                    <Divider />
                    <TonAssetStyled balance={tonAssetAmount} />
                    <Divider />
                    {canUseTron && !tronWallet && (
                        <>
                            <TronAssetsStyled usdt={null} />
                            <Divider />
                        </>
                    )}
                    {assets.map(asset => (
                        <>
                            <AnyChainAssetStyled balance={asset} key={asset.asset.id} />
                            <Divider />
                        </>
                    ))}
                </>
            ) : (
                <Skeletons />
            )}
        </Wrapper>
    );
};
