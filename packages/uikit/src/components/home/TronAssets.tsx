import React, { forwardRef } from 'react';
import { AppRoute } from '../../libs/routes';
import { useFormatFiat, useUSDTRate } from '../../state/rates';
import { ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { useNavigate } from '../../hooks/router/useNavigate';

export const TronAssetComponent = forwardRef<
    HTMLDivElement,
    {
        assetAmount: AssetAmount<TronAsset>;
        className?: string;
    }
>(({ assetAmount, className }, ref) => {
    const navigate = useNavigate();

    const { data: rate } = useUSDTRate();
    const { fiatPrice, fiatAmount } = useFormatFiat(rate, assetAmount.relativeAmount);

    return (
        <ListItem
            onClick={() =>
                navigate(AppRoute.coins + '/' + assetAmount.asset.id, { replace: false })
            }
            className={className}
            ref={ref}
        >
            <ListItemPayload>
                <TokenLogo src={assetAmount.image} noRadius={assetAmount.asset.noImageCorners} />
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
