import styled from 'styled-components';
import { AnyChainAsset, StakingPositionAsset, TonAsset } from '../../../home/Jettons';
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
import {
    getPortfolioBalanceId,
    PortfolioBalance,
    PortfolioTokenBalance,
    usePortfolioBalancesForList
} from '../../../../state/portfolio/usePortfolioBalances';

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

    .coin-label {
        background: ${props => props.theme.backgroundContentAttention} !important;
    }
`;

const StakingPositionAssetStyled = styled(StakingPositionAsset)`
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
    const { data: balances } = usePortfolioBalancesForList();

    const [tonAssetAmount, displayBalances, notIncluded] = useMemo(() => {
        if (!balances) {
            return [undefined, undefined, undefined];
        }
        const tonBalance = balances.find(
            (item): item is PortfolioTokenBalance =>
                item.kind === 'token' && item.assetAmount.asset.id === TON_ASSET.id
        )?.assetAmount;
        const restBalances = balances.filter(
            item => !(item.kind === 'token' && item.assetAmount.asset.id === TON_ASSET.id)
        );

        if (!restBalances.length) {
            return [tonBalance, [], undefined];
        }

        const stakingPositions = restBalances.filter(
            (item): item is Extract<PortfolioBalance, { kind: 'staking-position' }> =>
                item.kind === 'staking-position'
        );
        const tokenBalances = restBalances.filter(
            (item): item is PortfolioTokenBalance => item.kind === 'token'
        );

        let tokenBalancesToDisplay = tokenBalances.filter(token => token.isPinned);
        if (tokenBalancesToDisplay.length < 1) {
            tokenBalancesToDisplay = tokenBalances.slice(0, 1);
        }

        const nextDisplayBalances = [...stakingPositions, ...tokenBalancesToDisplay];
        if (nextDisplayBalances.length < 1) {
            return [tonBalance, restBalances.slice(0, 1), undefined];
        }

        const displayedTokenIds = new Set(
            tokenBalancesToDisplay.map(token => token.assetAmount.asset.id)
        );
        const notIncludedTokens = tokenBalances.filter(
            token => !displayedTokenIds.has(token.assetAmount.asset.id)
        );

        if (notIncludedTokens.length <= 1) {
            return [tonBalance, nextDisplayBalances, undefined];
        }

        const notIncludedBalance = notIncludedTokens.reduce(
            (acc, item) =>
                !item.price
                    ? acc
                    : acc.plus(item.assetAmount.relativeAmount.multipliedBy(item.price)),
            new BigNumber(0)
        );

        return [
            tonBalance,
            nextDisplayBalances,
            {
                assets: notIncludedTokens.slice(0, 4).map(token => token.assetAmount),
                balance: notIncludedBalance
            }
        ];
    }, [balances]);

    return (
        <Wrapper className={className}>
            {tonAssetAmount && displayBalances ? (
                <>
                    <TonAssetStyled balance={tonAssetAmount} />
                    {displayBalances.map(item => (
                        <React.Fragment key={getPortfolioBalanceId(item)}>
                            <Divider />
                            {item.kind === 'token' ? (
                                <AnyChainAssetStyled tokenBalance={item} />
                            ) : (
                                <StakingPositionAssetStyled stakingPosition={item} />
                            )}
                        </React.Fragment>
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
