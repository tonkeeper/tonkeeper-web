import React, { FC, forwardRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { useFormatFiat } from '../../state/rates';
import { ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { Button } from '../fields/Button';
import { formatFiatCurrency } from '../../hooks/balance';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useAddTronToAccount } from '../../state/wallet';
import styled from 'styled-components';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';

const usdtRate = {
    diff7d: '',
    diff24h: '',
    prices: 1
};

const TokenLogoNotRounded = styled(TokenLogo)`
    border-radius: unset;
`;

const tronAssetRate = (asset: TronAsset) => {
    if (asset.id === TRON_USDT_ASSET.id) {
        return usdtRate;
    }

    return undefined;
};

export const TronAssetComponent = forwardRef<
    HTMLDivElement,
    {
        assetAmount: AssetAmount<TronAsset>;
        className?: string;
    }
>(({ assetAmount, className }, ref) => {
    const navigate = useNavigate();

    const rate = useMemo(() => tronAssetRate(assetAmount.asset), [assetAmount.asset.id]);

    const { fiatPrice, fiatAmount } = useFormatFiat(rate, assetAmount.relativeAmount);

    return (
        <ListItem
            onClick={() => navigate(AppRoute.coins + '/' + assetAmount.asset.id)}
            className={className}
            ref={ref}
        >
            <ListItemPayload>
                {assetAmount.asset.id === TRON_USDT_ASSET.id ? (
                    <TokenLogoNotRounded src={assetAmount.image} />
                ) : (
                    <TokenLogo src={assetAmount.image} />
                )}
                <TokenLayout
                    name={assetAmount.asset.name!}
                    symbol={assetAmount.asset.symbol}
                    balance={assetAmount.stringRelativeAmount}
                    secondary={fiatPrice}
                    fiatAmount={fiatAmount}
                    label="TRC20"
                    rate={rate}
                />
            </ListItemPayload>
        </ListItem>
    );
});

const InactiveUSDA: FC<{ className?: string }> = ({ className }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();

    const { mutate, isLoading } = useAddTronToAccount();
    const isFullWidth = useIsFullWidthMode();

    return (
        <ListItem className={className}>
            <ListItemPayload>
                <TokenLogoNotRounded src={TRON_USDT_ASSET.image} />
                <TokenLayout
                    name={TRON_USDT_ASSET.name!}
                    symbol={TRON_USDT_ASSET.symbol}
                    balance=""
                    secondary={formatFiatCurrency(fiat, usdtRate.prices)}
                    fiatAmount=""
                    label="TRC20"
                    rate={usdtRate}
                />
                <Button
                    {...(isFullWidth ? { secondary: true } : { primary: true })}
                    size="small"
                    loading={isLoading}
                    onClick={() => mutate()}
                >
                    {t('activate')}
                </Button>
            </ListItemPayload>
        </ListItem>
    );
};

export const TronAssets: FC<{ usdt: AssetAmount | null; className?: string }> = React.memo(
    ({ usdt, className }) => {
        if (!usdt) {
            return <InactiveUSDA className={className} />;
        }
        return (
            <TronAssetComponent
                assetAmount={usdt as AssetAmount<TronAsset>}
                className={className}
            />
        );
    }
);
