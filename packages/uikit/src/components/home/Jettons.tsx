import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { Account, JettonsBalances } from '@tonkeeper/core/dist/tonApiV2';
import BigNumber from 'bignumber.js';
import { FC, forwardRef, useMemo } from 'react';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, StakingRoute } from '../../libs/routes';
import { toTokenRate, useFormatFiat, useRate } from '../../state/rates';
import { ListBlock, ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';
import { TronBalances } from '../../state/tron/tron';
import { TronAssetComponent } from './TronAssets';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { isTonAsset, isTronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import {
    TonAsset as TonAssetType,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { formatter } from '../../hooks/balance';
import { useJettonList } from '../../state/jetton';
import { isSignificantPendingWithdraw } from '../../state/staking/pendingWithdraw';
import { useStakingPosition } from '../../state/staking/useStakingPosition';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { StakingPoolIcon } from '../staking/StakingPoolIcon';
import {
    getPortfolioBalanceId,
    PortfolioBalance,
    PortfolioStakingPosition,
    PortfolioTokenBalance
} from '../../state/portfolio/usePortfolioBalances';

export interface TonAssetData {
    info: Account;
    jettons: JettonsBalances;
}

export interface AssetData {
    ton: TonAssetData;
    tron: TronBalances;
}

export const TonAsset = forwardRef<
    HTMLDivElement,
    {
        balance: AssetAmount;
        className?: string;
    }
>(({ balance, className }, ref) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { data } = useRate(CryptoCurrency.TON);
    const { fiatPrice, fiatAmount } = useFormatFiat(data, balance.relativeAmount);
    const isFullWidth = useIsFullWidthMode();

    return (
        <ListItem
            onClick={() => navigate(AppRoute.coins + '/ton', { replace: false })}
            className={className}
            ref={ref}
            backgroundHighlighted={isFullWidth}
        >
            <ListItemPayload>
                <TokenLogo src={TON_ASSET.image} noRadius={TON_ASSET.noImageCorners} />
                <TokenLayout
                    name={t('Toncoin')}
                    symbol={balance.asset.symbol}
                    balance={balance.stringRelativeAmount}
                    secondary={fiatPrice}
                    fiatAmount={fiatAmount}
                    rate={data}
                />
            </ListItemPayload>
        </ListItem>
    );
});

export const AnyChainAsset = forwardRef<
    HTMLDivElement,
    {
        tokenBalance: PortfolioTokenBalance;
        className?: string;
    }
>(({ tokenBalance, className }, ref) => {
    const balance = tokenBalance.assetAmount;

    if (isTronAsset(balance.asset)) {
        return (
            <TronAssetComponent
                ref={ref}
                assetAmount={balance as AssetAmount<TronAsset>}
                className={className}
            />
        );
    } else {
        return <JettonAsset ref={ref} tokenBalance={tokenBalance} className={className} />;
    }
});

export const JettonAsset = forwardRef<
    HTMLDivElement,
    {
        tokenBalance: PortfolioTokenBalance;
        className?: string;
    }
>(({ tokenBalance, className }, ref) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { fiat } = useAppContext();

    const balance = tokenBalance.assetAmount;
    const { data: jettonBalances } = useJettonList();
    const isFullWidth = useIsFullWidthMode();

    const stakingPool = tokenBalance.stakingPool;
    const { data: stakingPosition } = useStakingPosition(stakingPool?.address);

    const pendingWithdrawLine = useMemo(() => {
        if (!isFullWidth || !stakingPool || !stakingPosition) {
            return undefined;
        }
        const pending = stakingPosition.pendingWithdraw ?? 0;
        if (!isSignificantPendingWithdraw(pending)) {
            return undefined;
        }
        const pendingTon = shiftedDecimals(pending);
        const amount = formatter.formatDisplay(pendingTon);
        return t('staking_portfolio_pending_withdraw', { amount });
    }, [isFullWidth, stakingPool, stakingPosition, t]);

    const rate = useMemo(() => {
        const jetton = jettonBalances?.balances.find(j =>
            eqAddresses(j.jetton.address, balance.asset.address)
        );

        return jetton?.price ? toTokenRate(jetton.price, fiat) : undefined;
    }, [balance.asset.address, fiat, jettonBalances]);
    const { fiatPrice, fiatAmount } = useFormatFiat(rate, balance.relativeAmount);

    const verification = isTonAsset(balance.asset) ? balance.asset.verification : undefined;

    return (
        <ListItem
            onClick={() => {
                if (stakingPool) {
                    navigate(AppRoute.staking + StakingRoute.pool + '/' + stakingPool.address, {
                        replace: false
                    });
                } else {
                    navigate(
                        AppRoute.coins +
                            `/${encodeURIComponent(
                                tonAssetAddressToString((balance.asset as TonAssetType).address)
                            )}`,
                        { replace: false }
                    );
                }
            }}
            className={className}
            ref={ref}
            backgroundHighlighted={isFullWidth}
        >
            <ListItemPayload>
                {stakingPool ? (
                    <StakingPoolIcon pool={stakingPool} size={isFullWidth ? 44 : 40} />
                ) : (
                    <TokenLogo src={balance.asset.image} noRadius={balance.asset.noImageCorners} />
                )}
                <TokenLayout
                    name={
                        stakingPool ? t('staking_staked') : balance.asset.name ?? t('Unknown_COIN')
                    }
                    verification={stakingPool ? undefined : verification}
                    symbol={stakingPool ? undefined : balance.asset.symbol}
                    balance={balance.stringRelativeAmount}
                    secondary={stakingPool ? stakingPool.name : fiatPrice}
                    tertiary={pendingWithdrawLine}
                    fiatAmount={fiatAmount}
                    rate={stakingPool ? undefined : rate}
                />
            </ListItemPayload>
        </ListItem>
    );
});

export const StakingPositionAsset = forwardRef<
    HTMLDivElement,
    { stakingPosition: PortfolioStakingPosition; className?: string }
>(({ stakingPosition, className }, ref) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isFullWidth = useIsFullWidthMode();
    const { data: tonRate } = useRate(CryptoCurrency.TON);

    const tonAmount = useMemo(
        () => shiftedDecimals(stakingPosition.position.amount),
        [stakingPosition.position.amount]
    );
    const balanceStr = useMemo(
        () => `${tonAmount.toFixed(2, BigNumber.ROUND_DOWN)} TON`,
        [tonAmount]
    );
    const { fiatAmount } = useFormatFiat(tonRate, tonAmount);

    return (
        <ListItem
            onClick={() =>
                navigate(
                    AppRoute.staking + StakingRoute.pool + '/' + stakingPosition.pool.address,
                    {
                        replace: false
                    }
                )
            }
            className={className}
            ref={ref}
            backgroundHighlighted={isFullWidth}
        >
            <ListItemPayload>
                <StakingPoolIcon pool={stakingPosition.pool} size={isFullWidth ? 44 : 40} />
                <TokenLayout
                    name={t('staking_staked')}
                    balance={balanceStr}
                    secondary={stakingPosition.pool.name}
                    fiatAmount={fiatAmount}
                    rate={undefined}
                />
            </ListItemPayload>
        </ListItem>
    );
});

export const JettonList: FC<{ balances: PortfolioBalance[] }> = ({ balances }) => {
    const [tonTokenBalance, restBalances] = useMemo(() => {
        return [
            balances.find(
                (item): item is PortfolioTokenBalance =>
                    item.kind === 'token' && item.assetAmount.asset.id === TON_ASSET.id
            ),
            balances.filter(
                item => !(item.kind === 'token' && item.assetAmount.asset.id === TON_ASSET.id)
            )
        ];
    }, [balances]);

    if (!tonTokenBalance) {
        return null;
    }

    return (
        <>
            <ListBlock noUserSelect>
                <TonAsset balance={tonTokenBalance.assetAmount} />
            </ListBlock>
            <ListBlock noUserSelect>
                {restBalances.map(item =>
                    item.kind === 'token' ? (
                        <AnyChainAsset key={getPortfolioBalanceId(item)} tokenBalance={item} />
                    ) : (
                        <StakingPositionAsset
                            key={getPortfolioBalanceId(item)}
                            stakingPosition={item}
                        />
                    )
                )}
            </ListBlock>
        </>
    );
};
