import styled from 'styled-components';
import { AnyChainAsset, TonAsset } from '../../../home/Jettons';
import { useAllChainsAssetsWithPrice } from '../../../../state/home';
import React, { FC, useMemo } from 'react';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { SkeletonImage, SkeletonText } from '../../../shared/Skeleton';
import { ColumnText } from '../../../Layout';
import BigNumber from 'bignumber.js';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useTranslation } from '../../../../hooks/translation';
import { Body3, Label1 } from '../../../Text';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useUserFiat } from '../../../../state/fiat';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { AppRoute } from '../../../../libs/routes';

const Wrapper = styled.div`
    overflow: hidden;
    border-radius: ${p => p.theme.corner2xSmall};
    background-color: ${p => p.theme.backgroundContent};
`;

const TonAssetStyled = styled(TonAsset)`
    border-radius: 0;

    & > * {
        border-top: none !important;
        padding: 8px 16px 8px 0 !important;
    }
`;

const AnyChainAssetStyled = styled(AnyChainAsset)`
    border-radius: 0;

    & > * {
        border-top: none !important;
        padding: 8px 16px 8px 0 !important;
    }
`;

const Divider = styled.div`
    height: 1px;
    background-color: ${p => p.theme.separatorAlternate};
    width: 100%;
`;

const SkeletonWrapper = styled.div`
    padding: 8px 16px;
    height: 44px;
    box-sizing: content-box;
    display: flex;
    gap: 1rem;
    align-items: center;
`;

const SkeletonRow = () => {
    return (
        <SkeletonWrapper>
            <SkeletonImage width="40px" />
            <ColumnText
                text={<SkeletonText width="200px" />}
                secondary={<SkeletonText size="small" width="40px" />}
            ></ColumnText>
        </SkeletonWrapper>
    );
};

export const MobileProHomeWidgetTokens: FC<{ className?: string }> = ({ className }) => {
    const { assets: allAssets } = useAllChainsAssetsWithPrice() ?? [];

    const [tonAssetAmount, assets, notIncluded] = useMemo(() => {
        if (!allAssets) {
            return [undefined, undefined, undefined];
        }
        const ton = allAssets.find(item => item.assetAmount.asset.id === TON_ASSET.id)?.assetAmount;
        const jettons = allAssets.filter(item => item.assetAmount.asset.id !== TON_ASSET.id);

        if (!jettons.length) {
            return [ton, [], undefined];
        }

        let jettonsToDisplay = jettons.filter(j => j.isPinned);
        if (jettonsToDisplay.length < 1) {
            jettonsToDisplay = jettons.slice(0, 1);
        }

        if (
            jettonsToDisplay.length === jettons.length ||
            jettonsToDisplay.length + 1 === jettons.length
        ) {
            return [ton, jettons, undefined];
        }

        const notIncludedJettons = jettons.slice(jettonsToDisplay.length, jettons.length);

        const notIncludedBalance = notIncludedJettons.reduce(
            (acc, item) =>
                !item.price
                    ? acc
                    : acc.plus(item.assetAmount.relativeAmount.multipliedBy(item.price)),
            new BigNumber(0)
        );

        return [
            ton,
            jettonsToDisplay,
            {
                assets: notIncludedJettons.slice(0, 4).map(j => j.assetAmount),
                balance: notIncludedBalance
            }
        ];
    }, [allAssets]);

    return (
        <Wrapper className={className}>
            {tonAssetAmount && assets ? (
                <>
                    <TonAssetStyled balance={tonAssetAmount} />
                    {assets.map(asset => (
                        <>
                            <Divider />
                            <AnyChainAssetStyled
                                balance={asset.assetAmount}
                                key={asset.assetAmount.asset.id}
                            />
                        </>
                    ))}
                    {!!notIncluded && (
                        <>
                            <Divider />
                            <AllOtherAssets {...notIncluded} />
                        </>
                    )}
                </>
            ) : (
                <>
                    <SkeletonRow />
                    <Divider />
                    <SkeletonRow />
                    <Divider />
                    <SkeletonRow />
                </>
            )}
        </Wrapper>
    );
};

const AllOtherAssetsWrapper = styled.div`
    padding: 8px 16px;
    display: flex;
    gap: 12px;
    align-items: center;
`;

const AllOtherAssetsImages = styled.div`
    display: grid;
    gap: 2px;
    grid-template: 1fr 1fr / 1fr 1fr;
    flex-shrink: 0;

    > img {
        width: 19px;
        height: 19px;
        border-radius: ${p => p.theme.cornerFull};
    }
`;

const AllOtherAssetsText = styled.div`
    display: flex;
    flex-direction: column;
    width: calc(100% - 56px);

    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const AllOtherAssetsTextFirstLine = styled.div`
    display: flex;
    gap: 8px;
    justify-content: space-between;

    > * {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    > *:last-child {
        flex-shrink: 0;
    }
`;

const AllOtherAssets: FC<{ className?: string; assets: AssetAmount[]; balance: BigNumber }> = ({
    assets,
    balance
}) => {
    const { t } = useTranslation();
    const fiat = useUserFiat();
    const navigate = useNavigate();

    return (
        <AllOtherAssetsWrapper onClick={() => navigate(AppRoute.coins)}>
            <AllOtherAssetsImages>
                {assets.map(a => (
                    <img src={a.image} key={a.asset.id} />
                ))}
            </AllOtherAssetsImages>
            <AllOtherAssetsText>
                <AllOtherAssetsTextFirstLine>
                    <Label1>{assets.map(p => p.asset.symbol).join(', ')}</Label1>
                    <Label1>{formatFiatCurrency(fiat, balance)}</Label1>
                </AllOtherAssetsTextFirstLine>
                <Body3>{t('jettons_list_title')}</Body3>
            </AllOtherAssetsText>
        </AllOtherAssetsWrapper>
    );
};
