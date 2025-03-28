import React, { FC, forwardRef } from 'react';
import { AppRoute } from '../../libs/routes';
import { useFormatFiat, useUSDTRate } from '../../state/rates';
import { ListItem } from '../List';
import { ListItemPayload, TokenLayout, TokenLogo } from './TokenLayout';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import styled from 'styled-components';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { useNavigate } from '../../hooks/router/useNavigate';

const TokenLogoNotRounded = styled(TokenLogo)`
    border-radius: unset;
`;

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
